import { NextRequest, NextResponse } from "next/server";
import { requireSupplier } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";

const VALID_TRANSITIONS: Record<string, string[]> = {
  assigned: ["accepted", "rejected"],
  notified: ["accepted", "rejected"],
  accepted: ["packing"],
  packing: ["ready_for_pickup"],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSupplier();
    if ("response" in auth) return auth.response;
    const { supabase, supplier, user } = auth;
    const { id: fulfillmentId } = await params;
    const body = await request.json();
    const { status, tracking_id, courier_name, notes } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: "status is required" }, { status: 400 });
    }

    const { data: fulfillment, error: fetchError } = await supabase
      .from("order_fulfillments")
      .select("id, status, order_id, supplier_id")
      .eq("id", fulfillmentId)
      .single();

    if (fetchError || !fulfillment) {
      return NextResponse.json({ success: false, error: "Fulfillment not found" }, { status: 404 });
    }

    if (fulfillment.supplier_id !== supplier.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const allowed = VALID_TRANSITIONS[fulfillment.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from "${fulfillment.status}" to "${status}"` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    const now = new Date().toISOString();
    if (status === "accepted") updateData.accepted_at = now;
    else if (status === "rejected") updateData.rejected_at = now;
    else if (status === "packing") updateData.packing_at = now;
    else if (status === "ready_for_pickup") updateData.ready_at = now;

    if (tracking_id) updateData.tracking_id = tracking_id;
    if (courier_name) updateData.courier_name = courier_name;
    if (notes) updateData.notes = notes;

    const { error: updateError } = await supabase
      .from("order_fulfillments")
      .update(updateData)
      .eq("id", fulfillmentId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    const fulfillmentStatusMap: Record<string, string> = {
      accepted: "supplier_accepted",
      rejected: "supplier_rejected",
      packing: "supplier_packing",
      ready_for_pickup: "ready_for_pickup",
    };

    if (fulfillmentStatusMap[status]) {
      await supabase
        .from("orders")
        .update({ fulfillment_status: fulfillmentStatusMap[status], updated_at: now })
        .eq("id", fulfillment.order_id);
    }

    await logActivity({
      action: `fulfillment_${status}`,
      entity: "order",
      entityId: fulfillment.order_id,
      userId: user.id,
      before: { fulfillment_status: fulfillment.status },
      after: { fulfillment_status: status, tracking_id: tracking_id || null, courier_name: courier_name || null },
    });

    return NextResponse.json({ success: true, message: `Fulfillment updated to "${status}"` });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
