import { NextResponse } from "next/server";
import { requirePermission, createAdminClient } from "@/lib/supabase/server";
import { cancelShipment } from "@/lib/shiprocket";
import { logActivity } from "@/lib/utils/activity";

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("orders", "edit");
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { shipment_id, order_id } = body;

    if (!shipment_id || !order_id) {
      return NextResponse.json(
        { success: false, error: "shipment_id and order_id are required" },
        { status: 400 }
      );
    }

    const result = await cancelShipment(shipment_id);

    const adminDb = await createAdminClient();

    // Restore stock for cancelled order items
    const { data: orderItems } = await adminDb
      .from("orders")
      .select("items")
      .eq("id", order_id)
      .single();

    if (orderItems?.items && Array.isArray(orderItems.items)) {
      for (const item of orderItems.items) {
        if (item.product_id && item.quantity) {
          const { data: product } = await adminDb
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (product) {
            const newStock = product.stock + item.quantity;
            await adminDb
              .from("products")
              .update({ stock: newStock })
              .eq("id", item.product_id);
            await adminDb.from("stock_history").insert({
              product_id: item.product_id,
              change_type: "return",
              quantity_before: product.stock,
              quantity_after: newStock,
              quantity_change: item.quantity,
              reason: `Shipment cancelled — ${shipment_id}`,
              order_id: order_id,
              performed_by: auth.user.id,
            });
          }
        }
      }
    }

    await adminDb
      .from("orders")
      .update({
        order_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    await logActivity(
      "shipment_cancelled",
      "order",
      order_id,
      { shipment_id, reason: result.message, stock_restored: true },
      auth.user.id
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
