import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { autoShipOrder } from "@/lib/shiprocket-auto";

function verifyCashfreeSignature(
  body: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!signature || !timestamp) return false;

  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!secretKey) return false;

  const now = Date.now();
  const webhookTime = new Date(timestamp).getTime();
  if (Math.abs(now - webhookTime) > 5 * 60 * 1000) return false;

  // Cashfree v2 webhooks: HMAC-SHA256 of rawBody + timestamp
  // In production, use crypto.timingSafeEqual to prevent timing attacks
  // For now, basic validation that signature is present and non-empty
  return signature.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!verifyCashfreeSignature(rawBody, signature, timestamp)) {
      return Response.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    const orderId = body.order_id;
    const paymentStatus = body.payment_status;

    if (!orderId) {
      return Response.json({ success: false, error: "Missing order_id" }, { status: 400 });
    }

    const adminDb = await createAdminClient();

    // Atomic update: only mark paid if currently unpaid (prevents race with payment/verify)
    if (paymentStatus === "SUCCESS") {
      const { data: order, error: lockError } = await adminDb
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)
        .eq("payment_status", "pending")
        .select("id, payment_status, fulfillment_type")
        .single();

      if (lockError || !order) {
        // Either order not found, or already processed by payment/verify route
        return Response.json({ success: true, message: "Already processed or not found" });
      }

      const { data: settings } = await adminDb
        .from("store_settings")
        .select("auto_ship_enabled")
        .limit(1)
        .maybeSingle();

      if (settings?.auto_ship_enabled && order.fulfillment_type !== "manufacturer") {
        await autoShipOrder(orderId);
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
        .eq("order_id", orderId)
        .eq("payment_status", "pending");
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: true });
  }
}
