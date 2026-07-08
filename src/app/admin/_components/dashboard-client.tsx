"use client";

import {
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import type { AnalyticsSummary, Order } from "@/types";
import Link from "next/link";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "success" | "warning" | "error" | "default"> = {
    delivered: "success",
    pending: "warning",
    confirmed: "warning",
    shipped: "warning",
    "out-for-delivery": "warning",
    cancelled: "error",
    returned: "error",
  };
  return <Badge variant={variants[status] || "default"}>{status.replace(/-/g, " ")}</Badge>;
}

export function DashboardClient({
  analytics,
  recentOrders,
}: {
  analytics: AnalyticsSummary;
  recentOrders: Order[];
}) {
  const a = analytics || {};
  const revenueTrend = (a.revenue_last_month ?? 0) > 0
    ? Math.round((((a.revenue_month ?? 0) - (a.revenue_last_month ?? 0)) / (a.revenue_last_month ?? 1)) * 100)
    : 0;
  const ordersTrend = (a.orders_last_month ?? 0) > 0
    ? Math.round((((a.orders_month ?? 0) - (a.orders_last_month ?? 0)) / (a.orders_last_month ?? 1)) * 100)
    : 0;

  const cards = [
    {
      label: "Total Revenue",
      value: formatPrice(a.total_revenue ?? 0),
      icon: IndianRupee,
      trend: `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}% this month`,
      up: revenueTrend >= 0,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Orders",
      value: a.total_orders ?? 0,
      icon: ShoppingCart,
      trend: `${ordersTrend >= 0 ? "+" : ""}${ordersTrend}% this month`,
      up: ordersTrend >= 0,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Customers",
      value: a.total_customers ?? 0,
      icon: Users,
      trend: "All time",
      up: true,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Total Products",
      value: a.total_products ?? 0,
      icon: Package,
      trend: "All time",
      up: true,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  const revenueDays = a.revenue_by_day || [];
  const maxRevenue = Math.max(...revenueDays.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Overview</span>
        <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Dashboard</h1>
        <p className="text-[13px] text-charcoal-muted mt-0.5">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-ivory-dark/60 p-5 rounded-xl hover:shadow-sm transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
              {card.trend && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-medium ${
                    card.up ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {card.up ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {card.trend}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-charcoal tracking-tight">{card.value}</p>
            <p className="text-[11px] text-charcoal-muted mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="bg-white border border-ivory-dark/60 p-5 rounded-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-charcoal">Revenue (Last 30 Days)</h2>
            <span className="text-[11px] text-charcoal-muted">
              {formatPrice(revenueDays.reduce((sum, d) => sum + d.revenue, 0))} total
            </span>
          </div>
          <div className="flex items-end gap-[3px] h-40">
            {revenueDays.map((day) => (
              <div
                key={day.date}
                className="flex-1 bg-gradient-to-t from-charcoal/80 to-charcoal/60 hover:from-charcoal hover:to-charcoal/80 transition-colors relative group rounded-t-sm min-w-[4px]"
                style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-charcoal text-ivory text-[10px] rounded-lg px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                  {formatPrice(day.revenue)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-charcoal-muted">
            <span>{revenueDays[0]?.date?.slice(5) || "No data"}</span>
            <span>{revenueDays[revenueDays.length - 1]?.date?.slice(5) || ""}</span>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-ivory-dark/60 p-5 rounded-xl">
          <h2 className="mb-4 text-[13px] font-semibold text-charcoal">Top Products</h2>
          <div className="space-y-3">
            {(a.top_products || []).slice(0, 5).map((product, i) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-medium text-charcoal-muted w-4 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-[13px] truncate text-charcoal">
                    {product.name}
                  </span>
                </div>
                <span className="text-[12px] font-medium text-charcoal-muted flex-shrink-0 ml-2">
                  {product.sales} sold
                </span>
              </div>
            ))}
            {(a.top_products || []).length === 0 && (
              <p className="text-[13px] text-charcoal-muted text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-ivory-dark/60 px-5 py-4">
          <h2 className="text-[13px] font-semibold text-charcoal">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-[11px] font-medium text-charcoal-muted hover:text-charcoal uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            View All <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-ivory-dark/60 text-left text-[11px] text-charcoal-muted uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Order ID</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                  <td className="px-5 py-3 font-medium text-charcoal">
                    #{order.order_id}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.order_status} />
                  </td>
                  <td className="px-5 py-3 text-charcoal font-medium">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-5 py-3 text-charcoal-muted">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-charcoal-muted">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
