import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, sku, category, stock, price, cost_price, stock_alert, images");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const list = products || [];

    const totalProducts = list.length;
    const totalStock = list.reduce((s, p) => s + (p.stock || 0), 0);
    const lowStockProducts = list.filter(
      (p) => p.stock > 0 && p.stock <= (p.stock_alert || LOW_STOCK_THRESHOLD)
    );
    const outOfStockProducts = list.filter((p) => p.stock === 0);

    const totalValueAtCost = list.reduce(
      (s, p) => s + (p.cost_price || 0) * (p.stock || 0),
      0
    );
    const totalValueAtRetail = list.reduce(
      (s, p) => s + (p.price || 0) * (p.stock || 0),
      0
    );

    const catMap: Record<string, { count: number; total_stock: number }> = {};
    list.forEach((p) => {
      const cat = p.category || "uncategorized";
      if (!catMap[cat]) catMap[cat] = { count: 0, total_stock: 0 };
      catMap[cat].count += 1;
      catMap[cat].total_stock += p.stock || 0;
    });

    const byCategory = Object.entries(catMap)
      .map(([category, d]) => ({ category, count: d.count, total_stock: d.total_stock }))
      .sort((a, b) => b.total_stock - a.total_stock);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_products: totalProducts,
          total_stock: totalStock,
          low_stock_count: lowStockProducts.length,
          out_of_stock_count: outOfStockProducts.length,
          total_value_at_cost: totalValueAtCost,
          total_value_at_retail: totalValueAtRetail,
        },
        low_stock_products: lowStockProducts,
        out_of_stock_products: outOfStockProducts,
        by_category: byCategory,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
