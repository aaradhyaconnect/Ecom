import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("orders", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { id: orderId } = await params;
    const body = await request.json();
    const { fulfillment_type, supplier_id } = body;

    if (!fulfillment_type || !["warehouse", "manufacturer"].includes(fulfillment_type)) {
      return Response.json(
        { success: false, error: "fulfillment_type must be 'warehouse' or 'manufacturer'" },
        { status: 400 }
      );
    }

    if (fulfillment_type === "manufacturer" && !supplier_id) {
      return Response.json(
        { success: false, error: "supplier_id required for manufacturer fulfillment" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_status, fulfillment_type, shiprocket_shipment_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return Response.json(
        { success: false, error: `Order not found: ${orderError?.message || "no match"}` },
        { status: 404 }
      );
    }

    if (order.shiprocket_shipment_id) {
      return Response.json(
        { success: false, error: "Cannot change fulfillment on shipped order" },
        { status: 400 }
      );
    }

    if (order.order_status === "cancelled" || order.order_status === "returned") {
      return Response.json(
        { success: false, error: "Cannot change fulfillment on cancelled/returned order" },
        { status: 400 }
      );
    }

    if (supplier_id) {
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id, is_active")
        .eq("id", supplier_id)
        .single();

      if (!supplier || !supplier.is_active) {
        return Response.json(
          { success: false, error: "Supplier not found or inactive" },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, unknown> = {
      fulfillment_type,
      fulfillment_status: "pending",
      updated_at: new Date().toISOString(),
    };

    if (fulfillment_type === "manufacturer") {
      updates.supplier_id = supplier_id;
    } else {
      updates.supplier_id = null;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (updateError) {
      return Response.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    if (fulfillment_type === "manufacturer" && supplier_id) {
      const { error: fulfillError } = await supabase
        .from("order_fulfillments")
        .insert({
          order_id: orderId,
          supplier_id,
          status: "assigned",
          assigned_at: new Date().toISOString(),
        });

      if (fulfillError) {
        // Non-critical: order is updated but fulfillment record failed
      }
    }

    return Response.json({
      success: true,
      message: `Order assigned to ${fulfillment_type}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
