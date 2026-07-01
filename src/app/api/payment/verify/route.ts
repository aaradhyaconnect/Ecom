import { NextRequest } from "next/server";
import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";
import crypto from "crypto";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!RAZORPAY_KEY_SECRET) {
      return Response.json(
        { success: false, error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .select("id,user_id,razorpay_order_id,payment_status")
      .eq("id", order_id)
      .single();

    if (
      orderError ||
      !order ||
      order.user_id !== user.id ||
      order.razorpay_order_id !== razorpay_order_id
    ) {
      return Response.json(
        { success: false, error: "Order could not be verified" },
        { status: 400 }
      );
    }

    if (order.payment_status === "paid") {
      return Response.json({
        success: true,
        message: "Payment already verified",
      });
    }

    const { error } = await adminDb
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .eq("razorpay_order_id", razorpay_order_id);

    if (error) {
      return Response.json(
        { success: false, error: "Failed to update order" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
