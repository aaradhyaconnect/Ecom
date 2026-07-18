import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants/site";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token || !action || !["accept", "reject"].includes(action)) {
      return new Response(
        `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>Invalid Link</h2><p>This acceptance link is invalid or has expired.</p></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    let payload: { order_id: string; supplier_id: string; exp: number };
    try {
      payload = JSON.parse(Buffer.from(token, "base64url").toString());
    } catch {
      return new Response(
        `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>Invalid Token</h2><p>This acceptance link is malformed.</p></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    if (Date.now() > payload.exp) {
      return new Response(
        `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>Link Expired</h2><p>This acceptance link has expired. Please contact the store admin.</p></body></html>`,
        { status: 410, headers: { "Content-Type": "text/html" } }
      );
    }

    const adminDb = await createAdminClient();

    const { data: order } = await adminDb
      .from("orders")
      .select("id, order_id, fulfillment_status, supplier_id")
      .eq("id", payload.order_id)
      .single();

    if (!order) {
      return new Response(
        `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>Order Not Found</h2><p>This order no longer exists.</p></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    if (order.supplier_id !== payload.supplier_id) {
      return new Response(
        `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>Unauthorized</h2><p>This link is not valid for this order.</p></body></html>`,
        { status: 403, headers: { "Content-Type": "text/html" } }
      );
    }

    if (order.fulfillment_status !== "supplier_notified") {
      const statusText = order.fulfillment_status === "supplier_accepted"
        ? "already accepted"
        : order.fulfillment_status === "supplier_rejected"
          ? "already rejected"
          : `in status: ${order.fulfillment_status}`;

      return new Response(
        `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>Order ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2><p>This order has been ${statusText}.</p></body></html>`,
        { status: 409, headers: { "Content-Type": "text/html" } }
      );
    }

    const newStatus = action === "accept" ? "supplier_accepted" : "supplier_rejected";
    const now = new Date().toISOString();

    await adminDb
      .from("orders")
      .update({
        fulfillment_status: newStatus,
        ...(action === "accept"
          ? { supplier_accepted_at: now }
          : {}),
        updated_at: now,
      })
      .eq("id", payload.order_id);

    await adminDb
      .from("order_fulfillments")
      .update({
        status: action === "accept" ? "accepted" : "rejected",
        ...(action === "accept"
          ? { accepted_at: now }
          : { rejected_at: now }),
        updated_at: now,
      })
      .eq("order_id", payload.order_id)
      .eq("supplier_id", payload.supplier_id);

    const title = action === "accept" ? "Order Accepted" : "Order Rejected";
    const message = action === "accept"
      ? `Thank you! Order ${order.order_id} has been accepted. Please pack the order and mark it ready for pickup.`
      : `Order ${order.order_id} has been rejected. The store admin will be notified.`;

    return new Response(
      `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>${title}</h2><p>${message}</p><p style="color:#666;margin-top:24px;">${SITE.name}</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch {
    return new Response(
      `<html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;"><h2>Error</h2><p>Something went wrong. Please try again.</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
