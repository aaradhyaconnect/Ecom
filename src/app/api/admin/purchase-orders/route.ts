import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("customers", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "";
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("purchase_orders")
      .select("*, suppliers(name)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.ilike("po_number", `%${escaped}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await request.json();

    const { count } = await supabase
      .from("purchase_orders")
      .select("id", { count: "exact", head: true });

    const year = new Date().getFullYear();
    const poNumber = `PO-${year}-${String((count || 0) + 1).padStart(3, "0")}`;

    const items = body.items || [];
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; cost_price: number }) =>
        sum + (item.quantity || 0) * (item.cost_price || 0),
      0
    );
    const tax = Number(body.tax) || 0;
    const total = subtotal + tax;

    const po = {
      po_number: poNumber,
      supplier_id: body.supplier_id || null,
      status: "draft",
      subtotal,
      tax,
      total,
      expected_date: body.expected_date || null,
      notes: body.notes || "",
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: poData, error: poError } = await supabase
      .from("purchase_orders")
      .insert(po)
      .select()
      .single();

    if (poError) {
      return NextResponse.json({ success: false, error: poError.message }, { status: 500 });
    }

    if (items.length > 0) {
      const poItems = items.map(
        (item: {
          product_id: string;
          product_name: string;
          sku?: string;
          quantity: number;
          cost_price: number;
        }) => ({
          po_id: poData.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          sku: item.sku || "",
          quantity: item.quantity || 1,
          received_qty: 0,
          cost_price: item.cost_price || 0,
          total: (item.quantity || 1) * (item.cost_price || 0),
          created_at: new Date().toISOString(),
        })
      );

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(poItems);

      if (itemsError) {
        return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, data: poData });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
