"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Package,
} from "lucide-react";
import { formatPrice, formatDateShort } from "@/lib/utils/format";
import type { AnalyticsSummary } from "@/types";

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  shipped: "#8b5cf6",
  "out-for-delivery": "#f97316",
  delivered: "#22c55e",
  cancelled: "#ef4444",
  returned: "#6b7280",
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const data = await res.json();
        if (data.success) setAnalytics(data.data);
      } catch {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-charcoal-muted/60">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-rose-400">Failed to load analytics</div>
      </div>
    );
  }

  const overviewCards = [
    {
      label: "Total Revenue",
      value: formatPrice(analytics.total_revenue),
      secondary: `${formatPrice(analytics.revenue_today)} today`,
      icon: IndianRupee,
      up: true,
    },
    {
      label: "Revenue This Month",
      value: formatPrice(analytics.revenue_month),
      secondary: `${analytics.orders_month} orders`,
      icon: TrendingUp,
      up: true,
    },
    {
      label: "Total Orders",
      value: analytics.total_orders,
      secondary: `${analytics.orders_today} today`,
      icon: ShoppingCart,
      up: true,
    },
    {
      label: "Total Products",
      value: analytics.total_products,
      secondary: `${analytics.total_customers} customers`,
      icon: Package,
      up: true,
    },
  ];

  const maxRevenue = Math.max(...analytics.revenue_by_day.map((d) => d.revenue), 1);
  const maxStatusCount = Math.max(...analytics.orders_by_status.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-charcoal-muted">
          Detailed insights into your store performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="border bg-ivory p-5 "
          >
            <div className="flex items-center justify-between">
              <div className="bg-ivory-dark p-2">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-charcoal-muted">{card.label}</p>
            <p className="text-xs text-green-600 mt-1">{card.secondary}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border bg-ivory p-5 ">
          <h2 className="mb-4 text-sm font-semibold">
            Revenue (Last 30 Days)
          </h2>
          <div className="flex items-end gap-1 h-48">
            {analytics.revenue_by_day.map((day) => (
              <div
                key={day.date}
                className="flex-1 rounded-t bg-black/80 hover:bg-black transition-colors relative group min-w-[4px]"
                style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-charcoal text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {formatDateShort(day.date)}: {formatPrice(day.revenue)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-charcoal-muted/60">
            <span>
              {analytics.revenue_by_day[0]?.date?.slice(5)}
            </span>
            <span>
              {analytics.revenue_by_day[analytics.revenue_by_day.length - 1]?.date?.slice(5)}
            </span>
          </div>
        </div>

        <div className="border bg-ivory p-5 ">
          <h2 className="mb-4 text-sm font-semibold">Orders by Status</h2>
          <div className="space-y-3">
            {analytics.orders_by_status.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{item.status}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-ivory-dark overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / maxStatusCount) * 100}%`,
                      backgroundColor: statusColors[item.status] || "#6b7280",
                    }}
                  />
                </div>
              </div>
            ))}
            {analytics.orders_by_status.length === 0 && (
              <p className="text-sm text-charcoal-muted/60">No orders yet</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {analytics.orders_by_status.map((item) => {
              const total = analytics.orders_by_status.reduce(
                (sum, s) => sum + s.count,
                0
              );
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.status} className="flex items-center gap-1.5">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: statusColors[item.status] || "#6b7280",
                    }}
                  />
                  <span className="text-xs capitalize text-charcoal-muted">
                    {item.status} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border bg-ivory p-5 ">
        <h2 className="mb-4 text-sm font-semibold">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-charcoal-muted">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4 text-right">Units Sold</th>
                <th className="pb-3 pr-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_products.map((product, i) => (
                <tr key={product.name} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-charcoal-muted/60">{i + 1}</td>
                  <td className="py-3 pr-4 font-medium">{product.name}</td>
                  <td className="py-3 pr-4 text-right">{product.sales}</td>
                  <td className="py-3 pr-4 text-right font-medium">
                    {formatPrice(product.revenue)}
                  </td>
                </tr>
              ))}
              {analytics.top_products.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-charcoal-muted/60">
                    No sales data yet
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
