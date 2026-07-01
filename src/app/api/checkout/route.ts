import { NextRequest } from "next/server";
import { createServerSupabase, createAdminClient } from "@/lib/supabase/server";
import { generateOrderId } from "@/lib/utils/format";
import type { Product } from "@/types";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const SHIPPING_THRESHOLD = 999;
const SHIPPING_CHARGE = 49;
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

async function createRazorpayOrder(amount: number, receipt: string) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.description || "Failed to create Razorpay order");
  }

  return res.json();
}

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

    if (!["cod", "razorpay"].includes(payment_method)) {
      return Response.json(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const productIds = [...new Set(items.map((item) => item.product_id))];
    const { data: products, error: productError } = await adminDb
      .from("products")
      .select("id,name,slug,images,price,stock,sizes,colors")
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
      if (!product || product.stock < item.quantity) {
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
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const shippingCharge = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;

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

    const discount = calculateDiscount(coupon, subtotal);
    const total = Math.max(subtotal + shippingCharge - discount, 0);
    const orderId = generateOrderId();
    let razorpayOrder = null;

    if (payment_method === "razorpay") {
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return Response.json(
          { success: false, error: "Payment gateway not configured" },
          { status: 500 }
        );
      }
      razorpayOrder = await createRazorpayOrder(total, orderId);
    }

    const { data: order, error } = await adminDb
      .from("orders")
      .insert({
        order_id: orderId,
        user_id: user.id,
        items: orderItems,
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
        razorpay_order_id: razorpayOrder?.id || null,
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: "Failed to create order" },
        { status: 500 }
      );
    }

    if (coupon?.code) {
      await adminDb
        .from("coupons")
        .update({ used_count: Number(coupon.used_count || 0) + 1 })
        .eq("code", coupon.code);
    }

    return Response.json({
      success: true,
      data: {
        ...order,
        razorpay_order: razorpayOrder,
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
