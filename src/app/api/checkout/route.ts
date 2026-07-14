import { NextRequest } from "next/server";
import { createServerSupabase, createAdminClient } from "@/lib/supabase/server";
import { generateOrderId } from "@/lib/utils/format";
import { rateLimitCheckout, cleanupRateLimitMap } from "@/lib/utils/rate-limit";
import { createCashfreeOrder, isCashfreeConfigured, terminateCashfreeOrder } from "@/lib/cashfree";
import type { Product } from "@/types";

import { SHIPPING } from "@/lib/constants/site";
import { sendOrderConfirmation } from "@/lib/email";

const { THRESHOLD: SHIPPING_THRESHOLD, CHARGE: SHIPPING_CHARGE } = SHIPPING;
const MAX_ITEM_QUANTITY = 20;

type CheckoutItem = {
  product_id?: string;
  quantity?: number;
  size?: string;
  color?: string;
};

type CouponRecord = {
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
};

function normalizeItems(items: unknown): Required<CheckoutItem>[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item): Required<CheckoutItem> | null => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as CheckoutItem;
      const quantity = Number(candidate.quantity);

      if (
        !candidate.product_id ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_ITEM_QUANTITY
      ) {
        return null;
      }

      return {
        product_id: candidate.product_id,
        quantity,
        size: String(candidate.size || ""),
        color: String(candidate.color || ""),
      };
    })
    .filter((item): item is Required<CheckoutItem> => Boolean(item));
}

function calculateDiscount(coupon: CouponRecord | null, subtotal: number): number {
  if (!coupon || subtotal < Number(coupon.min_order || 0)) return 0;

  const rawDiscount =
    coupon.discount_type === "percentage"
      ? (subtotal * Number(coupon.discount_value || 0)) / 100
      : Number(coupon.discount_value || 0);

  const cappedDiscount = coupon.max_discount
    ? Math.min(rawDiscount, Number(coupon.max_discount))
    : rawDiscount;

  return Math.min(Math.max(cappedDiscount, 0), subtotal);
}

export async function POST(request: NextRequest) {
  cleanupRateLimitMap();

  const { allowed, resetIn } = rateLimitCheckout(request);
  if (!allowed) {
    return Response.json(
      { success: false, error: `Too many requests. Try again in ${Math.ceil(resetIn / 1000)}s` },
      { status: 429 }
    );
  }

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shipping_address, payment_method } = body;
    const couponCode =
      typeof body.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : "";
    const items = normalizeItems(body.items);

    if (!items.length || items.length !== body.items?.length) {
      return Response.json(
        { success: false, error: "Cart contains invalid items" },
        { status: 400 }
      );
    }

    if (!shipping_address?.full_name || !shipping_address?.phone || !shipping_address?.street || !shipping_address?.city || !shipping_address?.state || !shipping_address?.pincode) {
      return Response.json(
        { success: false, error: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(String(shipping_address.phone)) || !/^\d{6}$/.test(String(shipping_address.pincode))) {
      return Response.json(
        { success: false, error: "Please enter a valid phone number and pincode" },
        { status: 400 }
      );
    }

    if (!["cod", "cashfree", "upi"].includes(payment_method)) {
      return Response.json(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const productIds = [...new Set(items.map((item) => item.product_id))];
    const { data: products, error: productError } = await adminDb
      .from("products")
      .select("id,name,slug,images,price,stock,sizes,colors,is_prebook,prebook_amount")
      .in("id", productIds);

    if (productError || !products || products.length !== productIds.length) {
      return Response.json(
        { success: false, error: "One or more products are unavailable" },
        { status: 400 }
      );
    }

    const productsById = new Map(
      (products as Product[]).map((product) => [String(product.id), product])
    );

    const orderItems = items.map((item) => {
      const product = productsById.get(item.product_id);
      if (!product) {
        throw new Error("One or more products are unavailable");
      }

      const isPrebook = (product as Product & { is_prebook?: boolean }).is_prebook || false;
      const prebookAmount = Number((product as Product & { prebook_amount?: number }).prebook_amount || 0);

      if (!isPrebook && product.stock < item.quantity) {
        throw new Error("One or more products are out of stock");
      }

      return {
        product_id: item.product_id,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images || [],
          price: Number(product.price),
        },
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        _stock: product.stock,
        _is_prebook: isPrebook,
        _prebook_amount: prebookAmount,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const prebookDepositTotal = orderItems.reduce(
      (sum, item) => {
        if (item._is_prebook) {
          return sum + (item._prebook_amount || item.product.price) * item.quantity;
        }
        return sum;
      },
      0
    );
    const regularItemsTotal = orderItems
      .filter((item) => !item._is_prebook)
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const payNowSubtotal = prebookDepositTotal + regularItemsTotal;
    const hasPrebookItems = orderItems.some((item) => item._is_prebook);
    const totalBalanceDue = hasPrebookItems
      ? orderItems.reduce((sum, item) => {
          if (item._is_prebook) {
            const deposit = item._prebook_amount || item.product.price;
            return sum + Math.max(0, item.product.price - deposit) * item.quantity;
          }
          return sum;
        }, 0)
      : 0;

    const shippingCharge = payNowSubtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

    let coupon: CouponRecord | null = null;
    if (couponCode) {
      const { data: couponData } = await adminDb
        .from("coupons")
        .select("code,discount_type,discount_value,min_order,max_discount,usage_limit,used_count,expires_at")
        .eq("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();

      const isExpired = couponData?.expires_at
        ? new Date(couponData.expires_at).getTime() < Date.now()
        : false;
      const isUsedUp = Boolean(
        couponData && couponData.usage_limit > 0 && couponData.used_count >= couponData.usage_limit
      );

      if (!couponData || isExpired || isUsedUp) {
        return Response.json(
          { success: false, error: "Invalid or expired coupon code" },
          { status: 400 }
        );
      }

      coupon = couponData as CouponRecord;
    }

    const discount = calculateDiscount(coupon, payNowSubtotal);
    const total = Math.max(payNowSubtotal + shippingCharge - discount, 0);
    const orderId = generateOrderId();
    let cashfreeOrder = null;

    if (payment_method === "cashfree" || payment_method === "upi") {
      if (!isCashfreeConfigured()) {
        return Response.json(
          { success: false, error: "Payment gateway not configured" },
          { status: 500 }
        );
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      cashfreeOrder = await createCashfreeOrder({
        order_id: orderId,
        order_amount: total,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: shipping_address.full_name,
          customer_email: user.email || "",
          customer_phone: shipping_address.phone,
        },
        order_meta: {
          return_url: `${siteUrl}/account/orders/{order_id}?cashfree=true`,
        },
      });
    }

    const { data: order, error } = await adminDb
      .from("orders")
      .insert({
        order_id: orderId,
        user_id: user.id,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        items: orderItems.map(({ _stock, _is_prebook, _prebook_amount, ...rest }) => rest),
        shipping_address,
        billing_address: shipping_address,
        payment_method,
        payment_status: "pending",
        order_status: "pending",
        subtotal,
        shipping_charge: shippingCharge,
        discount,
        total,
        coupon_code: coupon?.code || null,
        cashfree_order_id: cashfreeOrder?.cf_order_id || null,
        is_prebook: hasPrebookItems,
        prebook_amount: prebookDepositTotal,
        balance_amount: totalBalanceDue,
      })
      .select()
      .single();

    if (error) {
      if (cashfreeOrder) terminateCashfreeOrder(orderId).catch(() => {});
      return Response.json(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    const decremented: { id: string; quantity: number }[] = [];
    for (const item of orderItems) {
      if (item._is_prebook) continue;

      const { data: currentProduct } = await adminDb
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();

      if (!currentProduct || currentProduct.stock < item.quantity) {
        for (const d of decremented) {
          const { data: p } = await adminDb.from("products").select("stock").eq("id", d.id).single();
          if (p) await adminDb.from("products").update({ stock: p.stock + d.quantity }).eq("id", d.id);
        }
        await adminDb.from("orders").delete().eq("id", order.id);
        if (cashfreeOrder) terminateCashfreeOrder(orderId).catch(() => {});
        return Response.json(
          { success: false, error: "Insufficient stock. Please try again." },
          { status: 400 }
        );
      }

      const { error: decError, count } = await adminDb
        .from("products")
        .update({ stock: currentProduct.stock - item.quantity })
        .eq("id", item.product_id)
        .eq("stock", currentProduct.stock)
        .select()
        .then((res) => ({ error: res.error, count: res.data?.length ?? 0 }));

      if (decError || count === 0) {
        for (const d of decremented) {
          const { data: p } = await adminDb.from("products").select("stock").eq("id", d.id).single();
          if (p) await adminDb.from("products").update({ stock: p.stock + d.quantity }).eq("id", d.id);
        }
        await adminDb.from("orders").delete().eq("id", order.id);
        if (cashfreeOrder) terminateCashfreeOrder(orderId).catch(() => {});
        return Response.json(
          { success: false, error: "Insufficient stock. Please try again." },
          { status: 400 }
        );
      }
      decremented.push({ id: item.product_id, quantity: item.quantity });
    }

    if (coupon?.code) {
      let retries = 3;
      while (retries > 0) {
        const { data: freshCoupon } = await adminDb
          .from("coupons")
          .select("used_count")
          .eq("code", coupon.code)
          .single();
        if (!freshCoupon) break;
        const { error: couponErr } = await adminDb
          .from("coupons")
          .update({ used_count: (freshCoupon.used_count || 0) + 1 })
          .eq("code", coupon.code)
          .eq("used_count", freshCoupon.used_count || 0);
        if (!couponErr) break;
        retries--;
      }
    }

    // Send order confirmation email (non-blocking)
    sendOrderConfirmation({
      orderId,
      customerName: shipping_address.full_name || user.email || "Customer",
      customerEmail: user.email || "",
      items: orderItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        size: item.size,
        color: item.color,
      })),
      subtotal,
      shippingCharge,
      discount,
      total,
      paymentMethod: payment_method,
      shippingAddress: shipping_address,
    }).catch(() => {});

    return Response.json({
      success: true,
      data: {
        ...order,
        cashfree_order: cashfreeOrder,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
