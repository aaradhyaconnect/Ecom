"use client";

import {
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
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
  return <Badge variant={variants[status] || "default"}>{status}</Badge>;
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
    },
    {
      label: "Total Orders",
      value: a.total_orders ?? 0,
      icon: ShoppingCart,
      trend: `${ordersTrend >= 0 ? "+" : ""}${ordersTrend}% this month`,
      up: ordersTrend >= 0,
    },
    {
      label: "Total Customers",
      value: a.total_customers ?? 0,
      icon: Users,
      trend: "All time",
      up: true,
    },
    {
      label: "Total Products",
      value: a.total_products ?? 0,
      icon: Package,
      trend: "All time",
      up: true,
    },
  ];

  const revenueDays = a.revenue_by_day || [];
  const maxRevenue = Math.max(
    ...revenueDays.map((d) => d.revenue),
    1
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-gray-100 p-2">
                <card.icon className="h-5 w-5" />
              </div>
              {card.trend && (
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    card.up ? "text-green-600" : "text-red-600"
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
            <p className="mt-3 text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Revenue (Last 30 Days)</h2>
          <div className="flex items-end gap-1.5 h-40">
            {revenueDays.map((day) => (
              <div
                key={day.date}
                className="flex-1 rounded-t bg-black/80 hover:bg-black transition-colors relative group"
                style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {formatPrice(day.revenue)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400">
            <span>{revenueDays[0]?.date?.slice(5)}</span>
            <span>
              {revenueDays[revenueDays.length - 1]?.date?.slice(5)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Top Products</h2>
          <div className="space-y-3">
            {(a.top_products || []).slice(0, 5).map((product, i) => (
              <div
                key={product.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 w-4">
                    {i + 1}.
                  </span>
                  <span className="text-sm truncate max-w-[140px]">
                    {product.name}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {product.sales} sold
                </span>
              </div>
            ))}
            {(a.top_products || []).length === 0 && (
              <p className="text-sm text-gray-400">No data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-black hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="px-5 py-3 font-medium">Order ID</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">
                    {order.order_id}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.order_status} />
                  </td>
                  <td className="px-5 py-3">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
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
