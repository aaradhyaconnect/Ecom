import { createServerSupabase } from "@/lib/supabase/server";
import { DashboardClient } from "../_components/dashboard-client";
import type { AnalyticsSummary, Order } from "@/types";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabase();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersAllCount, ordersToday, ordersMonth, ordersLastMonth, orders30d, productsCount, customersCount, pendingOrders, lowStockProducts] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total, order_status, created_at").gte("created_at", todayStart),
    supabase.from("orders").select("total, order_status, created_at").gte("created_at", monthStart),
    supabase.from("orders").select("total, order_status, created_at").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    supabase.from("orders").select("total, order_status, created_at, items").gte("created_at", thirtyDaysAgo),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("order_status", ["pending", "confirmed", "processing"]),
    supabase.from("products").select("id, name, stock, stock_alert, sku, images").lte("stock", 5).gt("stock_alert", 0).order("stock", { ascending: true }).limit(10),
  ]);

  const cancelledReturned = new Set(["cancelled", "returned"]);
  const recentOrders = orders30d.data || [];

  const revenueToday = (ordersToday.data || [])
    .filter((o) => !cancelledReturned.has(o.order_status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueMonth = (ordersMonth.data || [])
    .filter((o) => !cancelledReturned.has(o.order_status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueLastMonth = (ordersLastMonth.data || [])
    .filter((o) => !cancelledReturned.has(o.order_status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const recentNonCancelled = recentOrders.filter((o) => !cancelledReturned.has(o.order_status));

  const analytics: AnalyticsSummary = {
    total_revenue: recentNonCancelled.reduce((sum, o) => sum + (o.total || 0), 0),
    total_orders: ordersAllCount.count || 0,
    total_customers: customersCount.count || 0,
    total_products: productsCount.count || 0,
    revenue_today: revenueToday,
    orders_today: ordersToday.data?.length || 0,
    revenue_month: revenueMonth,
    orders_month: ordersMonth.data?.length || 0,
    revenue_last_month: revenueLastMonth,
    orders_last_month: ordersLastMonth.data?.length || 0,
    top_products: Object.entries(
      recentOrders
        .filter((o) => o.order_status === "delivered")
        .flatMap((o) => {
          const items = (o as { items?: { product?: { name?: string }; product_name?: string; quantity?: number; price?: number }[] }).items || [];
          return items.map((i) => ({
            name: i.product?.name || i.product_name || "Unknown",
            sales: i.quantity || 0,
            revenue: (i.price || 0) * (i.quantity || 0),
          }));
        })
        .reduce<Record<string, { sales: number; revenue: number }>>((acc, item) => {
          if (!acc[item.name]) acc[item.name] = { sales: 0, revenue: 0 };
          acc[item.name].sales += item.sales;
          acc[item.name].revenue += item.revenue;
          return acc;
        }, {})
    )
      .map(([name, data]) => ({ name, sales: data.sales, revenue: data.revenue }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10),
    orders_by_status: Object.entries(
      recentOrders.reduce<Record<string, number>>((acc, o) => {
        acc[o.order_status] = (acc[o.order_status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count })),
    revenue_by_day: (() => {
      const map = recentNonCancelled
        .reduce<Record<string, number>>((acc, o) => {
          const day = new Date(o.created_at).toISOString().split("T")[0];
          acc[day] = (acc[day] || 0) + (o.total || 0);
          return acc;
        }, {});
      return Object.entries(map)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));
    })(),
  };

  const { data: ordersData } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <DashboardClient
      analytics={analytics}
      recentOrders={(ordersData || []) as Order[]}
      pendingOrdersCount={pendingOrders.count || 0}
      lowStockProducts={(lowStockProducts.data || []) as { id: string; name: string; stock: number; stock_alert: number; sku?: string; images?: string[] }[]}
    />
  );
}
