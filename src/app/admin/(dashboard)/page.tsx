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

  const [ordersAll, ordersToday, ordersMonth, ordersLastMonth, productsCount, customersCount] = await Promise.all([
    supabase.from("orders").select("total, order_status, created_at, items").limit(10000),
    supabase.from("orders").select("total, order_status, created_at").gte("created_at", todayStart),
    supabase.from("orders").select("total, order_status, created_at").gte("created_at", monthStart),
    supabase.from("orders").select("total, order_status, created_at").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  const allOrders = ordersAll.data || [];
  const todayOrders = ordersToday.data || [];
  const monthOrders = ordersMonth.data || [];
  const lastMonthOrders = ordersLastMonth.data || [];

  const totalRevenue = allOrders
    .filter((o) => o.order_status !== "cancelled" && o.order_status !== "returned")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueMonth = monthOrders
    .filter((o) => o.order_status !== "cancelled" && o.order_status !== "returned")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const revenueLastMonth = lastMonthOrders
    .filter((o) => o.order_status !== "cancelled" && o.order_status !== "returned")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const analytics: AnalyticsSummary = {
    total_revenue: totalRevenue,
    total_orders: allOrders.length,
    total_customers: customersCount.count || 0,
    total_products: productsCount.count || 0,
    revenue_today: todayOrders
      .filter((o) => o.order_status !== "cancelled" && o.order_status !== "returned")
      .reduce((sum, o) => sum + (o.total || 0), 0),
    orders_today: todayOrders.length,
    revenue_month: revenueMonth,
    orders_month: monthOrders.length,
    revenue_last_month: revenueLastMonth,
    orders_last_month: lastMonthOrders.length,
    top_products: Object.entries(
      allOrders
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
      allOrders.reduce<Record<string, number>>((acc, o) => {
        acc[o.order_status] = (acc[o.order_status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count })),
    revenue_by_day: (() => {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const map = allOrders
        .filter((o) => o.order_status !== "cancelled" && o.order_status !== "returned" && new Date(o.created_at) >= thirtyDaysAgo)
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
    />
  );
}
