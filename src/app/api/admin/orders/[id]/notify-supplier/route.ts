import { NextRequest } from "next/server";
import { requirePermission, createAdminClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants/site";

async function sendSupplierNotification(
  supplierEmail: string,
  supplierName: string,
  orderId: string,
  orderItems: { name: string; quantity: number }[],
  customerName: string,
  shippingAddress: string,
  token: string
) {
  const acceptUrl = `${SITE.url}/api/supplier/accept?token=${token}&action=accept`;
  const rejectUrl = `${SITE.url}/api/supplier/accept?token=${token}&action=reject`;
  const portalUrl = `${SITE.url}/supplier/dashboard`;

  const itemList = orderItems
    .map((item) => `<li>${item.name} × ${item.quantity}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #111;">New Order Assignment</h2>
      <p>Hi ${supplierName},</p>
      <p>You have a new order to fulfill:</p>
      <div style="background: #f8f8f8; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Order:</strong> ${orderId}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Ship to:</strong> ${shippingAddress}</p>
        <p><strong>Items:</strong></p>
        <ul>${itemList}</ul>
      </div>
      <p>Please accept or reject this order:</p>
      <div style="margin: 24px 0;">
        <a href="${acceptUrl}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 8px;">Accept Order</a>
        <a href="${rejectUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reject Order</a>
      </div>
      <p style="color: #666; font-size: 12px;">This link expires in 48 hours.</p>
      <p style="margin-top: 16px;"><a href="${portalUrl}" style="color: #111; text-decoration: underline;">Open Supplier Portal</a> to manage all your orders.</p>
    </div>
 `;

  const { Resend } = await import("resend");
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  if (resend) {
    await resend.emails.send({
      from: `${SITE.name} <${process.env.EMAIL_FROM_ADDRESS || "orders@g2istyle.com"}>`,
      to: supplierEmail,
      subject: `New Order to Fulfill - ${orderId}`,
      html,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("orders", "edit");
    if ("response" in auth) return auth.response;

    const { id: orderId } = await params;
    const adminDb = await createAdminClient();

    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .select("id, order_id, items, shipping_address, fulfillment_type, supplier_id, fulfillment_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.fulfillment_type !== "manufacturer") {
      return Response.json(
        { success: false, error: "Order is not manufacturer-fulfilled" },
        { status: 400 }
      );
    }

    if (!order.supplier_id) {
      return Response.json(
        { success: false, error: "No supplier assigned to this order" },
        { status: 400 }
      );
    }

    const { data: supplier, error: supplierError } = await adminDb
      .from("suppliers")
      .select("id, name, email, is_active")
      .eq("id", order.supplier_id)
      .single();

    if (supplierError || !supplier || !supplier.is_active) {
      return Response.json(
        { success: false, error: "Supplier not found or inactive" },
        { status: 400 }
      );
    }

    // Generate acceptance token (simple approach: order_id + timestamp signed)
    const token = Buffer.from(
      JSON.stringify({ order_id: orderId, supplier_id: supplier.id, exp: Date.now() + 48 * 60 * 60 * 1000 })
    ).toString("base64url");

    const orderItems = (order.items || []).map(
      (item: { product?: { name?: string }; quantity?: number }) => ({
        name: item.product?.name || "Product",
        quantity: item.quantity || 1,
      })
    );

    const shippingAddr = order.shipping_address
      ? `${order.shipping_address.street || ""}, ${order.shipping_address.city || ""}, ${order.shipping_address.state || ""} ${order.shipping_address.pincode || ""}`
      : "Address on file";

    await sendSupplierNotification(
      supplier.email,
      supplier.name,
      order.order_id,
      orderItems,
      order.shipping_address?.full_name || "Customer",
      shippingAddr,
      token
    );

    await adminDb
      .from("orders")
      .update({
        fulfillment_status: "supplier_notified",
        supplier_notified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    await adminDb
      .from("order_fulfillments")
      .update({
        status: "notified",
        notified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("supplier_id", supplier.id);

    return Response.json({
      success: true,
      message: `Supplier ${supplier.name} notified via email`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
