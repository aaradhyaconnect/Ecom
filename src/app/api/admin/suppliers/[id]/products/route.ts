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

    const { data, error } = await supabase
      .from("supplier_products")
      .select("*, products(name, slug, price, stock, images, sku)")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;
    const body = await request.json();

    const mapping = {
      supplier_id: id,
      product_id: body.product_id,
      supplier_sku: body.supplier_sku || "",
      cost_price: Number(body.cost_price) || 0,
      lead_time_days: Number(body.lead_time_days) || 7,
      min_order_qty: Number(body.min_order_qty) || 1,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("supplier_products")
      .insert(mapping)
      .select("*, products(name, slug, price, stock, images, sku)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "This product is already linked to this supplier" },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const mappingId = url.searchParams.get("mapping_id");

    if (!mappingId) {
      return NextResponse.json({ success: false, error: "mapping_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("supplier_products")
      .delete()
      .eq("id", mappingId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
