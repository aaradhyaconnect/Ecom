import { NextResponse } from "next/server";
import { requireSupplier } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireSupplier();
    if ("response" in auth) return auth.response;
    const { supabase, supplier } = auth;

    const { data: products, error } = await supabase
      .from("supplier_products")
      .select(`
        id, supplier_sku, cost_price, lead_time_days, min_order_qty,
        products!inner (id, name, slug, price, stock, sku, images)
      `)
      .eq("supplier_id", supplier.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: products || [] });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
