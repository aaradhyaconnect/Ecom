import { NextResponse } from "next/server";
import { requireSupplier } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireSupplier();
    if ("response" in auth) return auth.response;
    const { supabase, supplier } = auth;

    const { data: fulfillments, error } = await supabase
      .from("order_fulfillments")
      .select(`
        *,
        orders!inner (
          id, order_id, total, items, shipping_address, order_status, created_at
        )
      `)
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const orders = (fulfillments || []).map((f: Record<string, unknown>) => ({
      fulfillment_id: f.id,
      status: f.status as string,
      assigned_at: f.assigned_at,
      notified_at: f.notified_at,
      accepted_at: f.accepted_at,
      rejected_at: f.rejected_at,
      packing_at: f.packing_at,
      ready_at: f.ready_at,
      picked_up_at: f.picked_up_at,
      tracking_id: f.tracking_id,
      courier_name: f.courier_name,
      notes: f.notes,
      order: f.orders,
    }));

    const stats = {
      total: orders.length,
      pending: orders.filter((o) => ["assigned", "notified"].includes(o.status)).length,
      accepted: orders.filter((o) => o.status === "accepted").length,
      packing: orders.filter((o) => o.status === "packing").length,
      ready: orders.filter((o) => o.status === "ready_for_pickup").length,
      picked_up: orders.filter((o) => o.status === "picked_up").length,
      rejected: orders.filter((o) => o.status === "rejected").length,
    };

    return NextResponse.json({ success: true, data: { orders, stats } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
