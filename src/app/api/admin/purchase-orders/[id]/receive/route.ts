import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;
    const body = await request.json();

    const { items } = body as {
      items: Array<{ item_id: string; received_qty: number }>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "items array is required" },
        { status: 400 }
      );
    }

    const { data: po } = await supabase
      .from("purchase_orders")
      .select("status")
      .eq("id", id)
      .single();

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }

    if (po.status === "cancelled" || po.status === "received") {
      return NextResponse.json(
        { success: false, error: `Cannot receive stock for a ${po.status} order` },
        { status: 400 }
      );
    }

    let allFullyReceived = true;

    for (const item of items) {
      const { data: poItem } = await supabase
        .from("purchase_order_items")
        .select("product_id, quantity, received_qty")
        .eq("id", item.item_id)
        .single();

      if (!poItem) continue;

      const newReceivedQty = (poItem.received_qty || 0) + (item.received_qty || 0);

      await supabase
        .from("purchase_order_items")
        .update({ received_qty: newReceivedQty })
        .eq("id", item.item_id);

      if (poItem.product_id && item.received_qty > 0) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", poItem.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({
              stock: (product.stock || 0) + item.received_qty,
              updated_at: new Date().toISOString(),
            })
            .eq("id", poItem.product_id);
        }
      }

      if (newReceivedQty < poItem.quantity) {
        allFullyReceived = false;
      }
    }

    const newStatus = allFullyReceived ? "received" : "partially_received";
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (allFullyReceived) {
      updates.received_date = new Date().toISOString();
    }

    await supabase
      .from("purchase_orders")
      .update(updates)
      .eq("id", id);

    await logActivity(
      "purchase_order_received",
      "purchase_order",
      id,
      { status: newStatus, received_items: items.length, user_id: user.id },
      user.id
    );

    return NextResponse.json({ success: true, data: { status: newStatus } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
