import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = url.searchParams.get("from") || defaultFrom.toISOString();
    const to = url.searchParams.get("to") || now.toISOString();
    const limit = Number(url.searchParams.get("limit")) || 20;

    const { data: orders, error } = await supabase
      .from("orders")
      .select("items, order_status, created_at")
      .gte("created_at", from)
      .lte("created_at", to);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const list = orders || [];
    const cancelledReturned = new Set(["cancelled", "returned"]);

    const productMap: Record<
      string,
      { id: string; name: string; sku: string; total_sold: number; total_revenue: number; total_orders: number }
    > = {};

    list.forEach((o) => {
      if (cancelledReturned.has(o.order_status)) return;
      const items = (o as { items?: { product_id?: string; id?: string; product?: { id?: string; name?: string; sku?: string }; quantity?: number; price?: number; size?: string; color?: string }[] }).items || [];
      items.forEach((item) => {
        const pid = item.product_id || item.product?.id || item.id || "";
        if (!pid) return;
        if (!productMap[pid]) {
          productMap[pid] = {
            id: pid,
            name: item.product?.name || "Unknown",
            sku: item.product?.sku || "",
            total_sold: 0,
            total_revenue: 0,
            total_orders: 0,
          };
        }
        productMap[pid].total_sold += item.quantity || 0;
        productMap[pid].total_revenue += (item.price || 0) * (item.quantity || 0);
        productMap[pid].total_orders += 1;
      });
    });

    const productIds = Object.keys(productMap);

    const stockMap: Record<string, number> = {};
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, stock")
        .in("id", productIds);

      if (products) {
        products.forEach((p) => {
          stockMap[p.id] = p.stock || 0;
        });
      }
    }

    const products = Object.values(productMap)
      .map((p) => ({
        ...p,
        current_stock: stockMap[p.id] ?? 0,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return NextResponse.json({ success: true, data: products });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
