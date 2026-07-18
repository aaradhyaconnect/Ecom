import { NextRequest } from "next/server";
import { createAdminClient, createServerSupabase } from "@/lib/supabase/server";
import { getCashfreeOrder, getCashfreePayments } from "@/lib/cashfree";
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
    const { order_id } = body;

    if (!order_id) {
      return Response.json(
        { success: false, error: "Missing order_id" },
        { status: 400 }
      );
    }

    const adminDb = await createAdminClient();
    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .select("id,user_id,cashfree_order_id,payment_status")
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

    if (!order.cashfree_order_id) {
      return Response.json(
        { success: false, error: "No Cashfree order found" },
        { status: 400 }
      );
    }

    const cfOrder = await getCashfreeOrder(order.cashfree_order_id);

    if (cfOrder.order_status === "PAID") {
      const payments = await getCashfreePayments(order.cashfree_order_id);
      const successfulPayment = payments.find(
        (p) => p.payment_status === "SUCCESS"
      );

      // Atomic update: only if still pending (race-safe with webhook)
      const { data: updated } = await adminDb
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          cashfree_payment_id: successfulPayment?.cf_payment_id || null,
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
    }

    if (cfOrder.order_status === "EXPIRED" || cfOrder.order_status === "TERMINATED") {
      await adminDb
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      return Response.json(
        { success: false, error: "Payment failed or expired" },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: "Payment is still pending" },
      { status: 400 }
    );
  } catch {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
