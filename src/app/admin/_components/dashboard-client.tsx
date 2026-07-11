"use client";

import {
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  PackageX,
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
  pendingOrdersCount,
  lowStockProducts,
}: {
  analytics: AnalyticsSummary;
  recentOrders: Order[];
  pendingOrdersCount: number;
  lowStockProducts: { id: string; name: string; stock: number; stock_alert: number; sku?: string; images?: string[] }[];
}) {
  const a = analytics || {};
  const revenueTrend = (a.revenue_last_month ?? 0) > 0
    ? Math.round((((a.revenue_month ?? 0) - (a.revenue_last_month ?? 0)) / (a.revenue_last_month ?? 1)) * 100)
    : 0;

  const cards = [
    {
      label: "Today's Sales",
      value: formatPrice(a.revenue_today ?? 0),
      icon: IndianRupee,
      trend: `${a.orders_today ?? 0} orders today`,
      up: true,
      color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Today's Orders",
      value: a.orders_today ?? 0,
      icon: ShoppingCart,
      trend: `${a.orders_month ?? 0} this month`,
      up: true,
      color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Pending Orders",
      value: pendingOrdersCount,
      icon: Clock,
      trend: "Needs attention",
      up: pendingOrdersCount === 0,
      color: pendingOrdersCount > 0 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      label: "Low Stock Products",
      value: lowStockProducts.length,
      icon: lowStockProducts.length > 0 ? AlertTriangle : Package,
      trend: lowStockProducts.length > 0 ? "Restock needed" : "All good",
      up: lowStockProducts.length === 0,
      color: lowStockProducts.length > 0 ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      label: "Total Revenue",
      value: formatPrice(a.total_revenue ?? 0),
      icon: IndianRupee,
      trend: `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}% vs last month`,
      up: revenueTrend >= 0,
      color: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Total Customers",
      value: a.total_customers ?? 0,
      icon: Users,
      trend: "All time",
      up: true,
      color: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400",
    },
  ];

  const revenueDays = a.revenue_by_day || [];
  const maxRevenue = Math.max(...revenueDays.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Overview</span>
        <h1 className="text-2xl font-serif font-bold text-charcoal dark:text-white mt-1">Dashboard</h1>
        <p className="text-[13px] text-charcoal-muted dark:text-white/60 mt-0.5">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 p-5 rounded-xl hover:shadow-sm transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
              {card.trend && (
                <span
                  className={`flex items-center gap-1 text-[11px] font-medium ${
                    card.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
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
            <p className="mt-3 text-2xl font-bold text-charcoal dark:text-white tracking-tight">{card.value}</p>
            <p className="text-[11px] text-charcoal-muted dark:text-white/50 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 p-5 rounded-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-charcoal dark:text-white">Revenue (Last 30 Days)</h2>
            <span className="text-[11px] text-charcoal-muted dark:text-white/50">
              {formatPrice(revenueDays.reduce((sum, d) => sum + d.revenue, 0))} total
            </span>
          </div>
          <div className="flex items-end gap-[3px] h-40">
            {revenueDays.map((day) => (
              <div
                key={day.date}
                className="flex-1 bg-gradient-to-t from-charcoal/80 to-charcoal/60 dark:from-gold/60 dark:to-gold/40 hover:from-charcoal hover:to-charcoal/80 dark:hover:from-gold dark:hover:to-gold/70 transition-colors relative group rounded-t-sm min-w-[4px]"
                style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-charcoal dark:bg-white/10 text-ivory dark:text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                  {formatPrice(day.revenue)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-charcoal-muted dark:text-white/40">
            <span>{revenueDays[0]?.date?.slice(5) || "No data"}</span>
            <span>{revenueDays[revenueDays.length - 1]?.date?.slice(5) || ""}</span>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 p-5 rounded-xl">
          <h2 className="mb-4 text-[13px] font-semibold text-charcoal dark:text-white">Top Products</h2>
          <div className="space-y-3">
            {(a.top_products || []).slice(0, 5).map((product, i) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-medium text-charcoal-muted dark:text-white/40 w-4 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-[13px] truncate text-charcoal dark:text-white">
                    {product.name}
                  </span>
                </div>
                <span className="text-[12px] font-medium text-charcoal-muted dark:text-white/50 flex-shrink-0 ml-2">
                  {product.sales} sold
                </span>
              </div>
            ))}
            {(a.top_products || []).length === 0 && (
              <p className="text-[13px] text-charcoal-muted dark:text-white/40 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white dark:bg-white/5 border border-amber-200 dark:border-amber-500/20 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-500/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-[13px] font-semibold text-charcoal dark:text-white">Low Stock Alert</h2>
              </div>
              <Link
                href="/admin/inventory"
                className="text-[11px] font-medium text-charcoal-muted dark:text-white/50 hover:text-charcoal dark:hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
              >
                Manage <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-ivory-dark/40 dark:divide-white/5">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 bg-ivory-dark/50 dark:bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                      {product.stock === 0 ? (
                        <PackageX className="h-4 w-4 text-rose-500" />
                      ) : (
                        <Package className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-charcoal dark:text-white truncate">{product.name}</p>
                      {product.sku && <p className="text-[11px] text-charcoal-muted dark:text-white/40">SKU: {product.sku}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className={`text-sm font-bold ${product.stock === 0 ? "text-rose-500" : "text-amber-600 dark:text-amber-400"}`}>
                      {product.stock}
                    </span>
                    <p className="text-[10px] text-charcoal-muted dark:text-white/40">/ {product.stock_alert} alert</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-ivory-dark/60 dark:border-white/10 px-5 py-4">
            <h2 className="text-[13px] font-semibold text-charcoal dark:text-white">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-[11px] font-medium text-charcoal-muted dark:text-white/50 hover:text-charcoal dark:hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-ivory-dark/60 dark:border-white/10 text-left text-[11px] text-charcoal-muted dark:text-white/40 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Order ID</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-ivory-dark/40 dark:border-white/5 last:border-0 hover:bg-ivory-dark/20 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 font-medium text-charcoal dark:text-white">
                      #{order.order_id}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.order_status} />
                    </td>
                    <td className="px-5 py-3 text-charcoal dark:text-white font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3 text-charcoal-muted dark:text-white/50">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-charcoal-muted dark:text-white/40">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
