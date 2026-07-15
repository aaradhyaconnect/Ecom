import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("reports", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = url.searchParams.get("from") || defaultFrom.toISOString();
    const to = url.searchParams.get("to") || now.toISOString();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("total, order_status, payment_method, created_at")
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
    const valid = list.filter((o) => !cancelledReturned.has(o.order_status));

    const totalRevenue = valid.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = valid.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    valid.forEach((o) => {
      const day = new Date(o.created_at).toISOString().split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0 };
      dailyMap[day].revenue += o.total || 0;
      dailyMap[day].orders += 1;
    });

    const daily = Object.entries(dailyMap)
      .map(([date, d]) => ({ date, revenue: d.revenue, orders: d.orders }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const pmMap: Record<string, { count: number; total: number }> = {};
    valid.forEach((o) => {
      const m = o.payment_method || "unknown";
      if (!pmMap[m]) pmMap[m] = { count: 0, total: 0 };
      pmMap[m].count += 1;
      pmMap[m].total += o.total || 0;
    });

    const byPaymentMethod = Object.entries(pmMap).map(([method, d]) => ({
      method,
      count: d.count,
      total: d.total,
    }));

    const statusMap: Record<string, number> = {};
    list.forEach((o) => {
      statusMap[o.order_status] = (statusMap[o.order_status] || 0) + 1;
    });

    const byStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: { total_revenue: totalRevenue, total_orders: totalOrders, avg_order_value: avgOrderValue },
        daily,
        by_payment_method: byPaymentMethod,
        by_status: byStatus,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
