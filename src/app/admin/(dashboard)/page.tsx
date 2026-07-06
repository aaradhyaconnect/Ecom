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
    supabase.from("orders").select("total, order_status, created_at"),
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
    top_products: [],
    orders_by_status: [],
    revenue_by_day: [],
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
