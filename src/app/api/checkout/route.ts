import { NextRequest } from "next/server";
import { createServerSupabase, createAdminClient } from "@/lib/supabase/server";
import { generateOrderId } from "@/lib/utils/format";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

async function createRazorpayOrder(amount: number, receipt: string) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(
        `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
      ).toString("base64")}`,
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
    const { items, shipping_address, payment_method, subtotal, shipping_charge, total, coupon_code } = body;

    if (!items?.length) {
      return Response.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!shipping_address?.full_name || !shipping_address?.phone || !shipping_address?.street || !shipping_address?.city || !shipping_address?.state || !shipping_address?.pincode) {
      return Response.json(
        { success: false, error: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    if (!["cod", "razorpay"].includes(payment_method)) {
      return Response.json(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

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

    const adminDb = await createAdminClient();

    const { data: order, error } = await adminDb
      .from("orders")
      .insert({
        order_id: orderId,
        user_id: user.id,
        items,
        shipping_address,
        payment_method,
        payment_status: payment_method === "cod" ? "pending" : "pending",
        order_status: "pending",
        subtotal,
        shipping_charge,
        total,
        coupon_code: coupon_code || null,
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
