import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { autoShipOrder } from "@/lib/shiprocket-auto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const orderId = body.order_id;
    const paymentStatus = body.payment_status;

    if (!orderId) {
      return Response.json({ success: false, error: "Missing order_id" }, { status: 400 });
    }

    const adminDb = await createAdminClient();

    const { data: settings } = await adminDb
      .from("store_settings")
      .select("auto_ship_enabled")
      .limit(1)
      .maybeSingle();

    if (paymentStatus === "SUCCESS") {
      const { data: order } = await adminDb
        .from("orders")
        .select("id, payment_status, order_status")
        .eq("id", orderId)
        .single();

      if (!order) {
        return Response.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      if (order.payment_status === "paid") {
        return Response.json({ success: true, message: "Already processed" });
      }

      await adminDb
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (settings?.auto_ship_enabled) {
        const shipResult = await autoShipOrder(orderId);
        if (shipResult.success) {
          await adminDb
            .from("orders")
            .update({
              order_status: "shipped",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        }
      }

      return Response.json({ success: true });
    }

    if (paymentStatus === "FAILED" || paymentStatus === "EXPIRED") {
      await adminDb
        .from("orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: true });
  }
}
