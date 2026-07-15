import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requirePermission("inventory", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data: settings } = await supabase
      .from("store_settings")
      .select("low_stock_threshold")
      .limit(1)
      .single();

    const threshold = settings?.low_stock_threshold ?? 5;

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, stock, price, images")
      .lte("stock", threshold)
      .order("stock", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: products || [],
      threshold,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
