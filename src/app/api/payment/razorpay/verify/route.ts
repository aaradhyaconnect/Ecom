import { NextRequest } from "next/server";
import { createServerSupabase, createAdminClient } from "@/lib/supabase/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { autoShipOrder } from "@/lib/shiprocket-auto";

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
        { success: false, error: "Missing payment details" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .select("id, user_id, payment_status, fulfillment_type")
      .eq("id", order_id)
      .single();

    if (orderError || !order || order.user_id !== user.id) {
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

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      return Response.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const { data: updated } = await adminDb
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .eq("payment_status", "pending")
      .select("id, fulfillment_type")
      .single();

    if (!updated) {
      return Response.json({
        success: true,
        message: "Payment already processed",
      });
    }

    const { data: settings } = await adminDb
      .from("store_settings")
      .select("auto_ship_enabled")
      .limit(1)
      .maybeSingle();

    let shipped = false;
    if (settings?.auto_ship_enabled && updated.fulfillment_type !== "manufacturer") {
      const shipResult = await autoShipOrder(order_id);
      shipped = shipResult.success;
    }

    return Response.json({
      success: true,
      message: "Payment verified successfully",
      shipped,
    });
  } catch {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
