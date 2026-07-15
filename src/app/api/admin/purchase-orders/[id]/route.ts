import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data: po, error } = await supabase
      .from("purchase_orders")
      .select("*, suppliers(*)")
      .eq("id", id)
      .single();

    if (error || !po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }

    const { data: items } = await supabase
      .from("purchase_order_items")
      .select("*, products(name, slug, images)")
      .eq("po_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      success: true,
      data: { ...po, items: items || [] },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.expected_date !== undefined) updates.expected_date = body.expected_date;
    if (body.supplier_id !== undefined) updates.supplier_id = body.supplier_id;

    if (body.status === "received") {
      updates.received_date = new Date().toISOString();
    }

    if (body.items) {
      const { data: existingItems } = await supabase
        .from("purchase_order_items")
        .select("id")
        .eq("po_id", id);

      const existingIds = new Set((existingItems || []).map((i) => i.id));
      const incomingIds = new Set(body.items.filter((i: { id?: string }) => i.id).map((i: { id: string }) => i.id));

      for (const itemId of existingIds) {
        if (!incomingIds.has(itemId)) {
          await supabase.from("purchase_order_items").delete().eq("id", itemId);
        }
      }

      for (const item of body.items) {
        if (item.id && existingIds.has(item.id)) {
          await supabase
            .from("purchase_order_items")
            .update({
              product_id: item.product_id || null,
              product_name: item.product_name,
              sku: item.sku || "",
              quantity: item.quantity || 1,
              cost_price: item.cost_price || 0,
              total: (item.quantity || 1) * (item.cost_price || 0),
            })
            .eq("id", item.id);
        } else if (!item.id) {
          await supabase.from("purchase_order_items").insert({
            po_id: id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            sku: item.sku || "",
            quantity: item.quantity || 1,
            received_qty: 0,
            cost_price: item.cost_price || 0,
            total: (item.quantity || 1) * (item.cost_price || 0),
            created_at: new Date().toISOString(),
          });
        }
      }

      const { data: freshItems } = await supabase
        .from("purchase_order_items")
        .select("total")
        .eq("po_id", id);

      const newSubtotal = (freshItems || []).reduce((sum, i) => sum + (i.total || 0), 0);
      updates.subtotal = newSubtotal;
      updates.total = newSubtotal + (body.tax ?? 0);
    }

    if (body.tax !== undefined) {
      updates.tax = body.tax;
      if (body.items === undefined) {
        const { data: items } = await supabase
          .from("purchase_order_items")
          .select("total")
          .eq("po_id", id);
        const subtotal = (items || []).reduce((sum, i) => sum + (i.total || 0), 0);
        updates.subtotal = subtotal;
        updates.total = subtotal + body.tax;
      }
    }

    const { data, error } = await supabase
      .from("purchase_orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data: po } = await supabase
      .from("purchase_orders")
      .select("status")
      .eq("id", id)
      .single();

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }

    if (po.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Only draft purchase orders can be deleted" },
        { status: 400 }
      );
    }

    await supabase.from("purchase_order_items").delete().eq("po_id", id);

    const { error } = await supabase.from("purchase_orders").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
