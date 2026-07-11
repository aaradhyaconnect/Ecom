"use client";

import { useState, useEffect, useCallback } from "react";
import { IndianRupee, ShoppingCart, TrendingUp, CreditCard, Loader2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

interface DailyBreakdown {
  date: string;
  orders: number;
  revenue: number;
}

interface PaymentMethod {
  method: string;
  orders: number;
  revenue: number;
}

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailyBreakdown: DailyBreakdown[];
  byPaymentMethod: PaymentMethod[];
}

function getDefaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function SalesReportPage() {
  const defaults = getDefaultDates();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports/sales?from=${from}&to=${to}`
      );
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSales();
  }, [fetchSales]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-900 mb-1">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="block w-full rounded-lg border border-ivory-dark/60 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-900 mb-1">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="block w-full rounded-lg border border-ivory-dark/60 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>
        <Button onClick={fetchSales} isLoading={loading} variant="secondary" size="sm">
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      )}

      {!loading && !data && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <IndianRupee className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No sales data available for this period.</p>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white border border-ivory-dark/60 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-gold/10 p-2 rounded-lg">
                  <IndianRupee className="h-4 w-4 text-gold-dark" />
                </div>
                <span className="text-xs font-medium text-gray-900">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(data.totalRevenue)}</p>
            </div>
            <div className="bg-white border border-ivory-dark/60 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-gold/10 p-2 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-gold-dark" />
                </div>
                <span className="text-xs font-medium text-gray-900">Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.totalOrders}</p>
            </div>
            <div className="bg-white border border-ivory-dark/60 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-gold/10 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-gold-dark" />
                </div>
                <span className="text-xs font-medium text-gray-900">Avg Order Value</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(data.avgOrderValue)}</p>
            </div>
          </div>

          <div className="bg-white border border-ivory-dark/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Daily Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ivory-dark/60 text-left text-[11px] uppercase tracking-wider font-medium text-gray-500">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4 text-right">Orders</th>
                    <th className="py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailyBreakdown.map((day) => (
                    <tr key={day.date} className="border-b border-ivory-dark/40 last:border-0">
                      <td className="py-3 pr-4 text-gray-900">{formatDate(day.date)}</td>
                      <td className="py-3 pr-4 text-right text-gray-900">{day.orders}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatPrice(day.revenue)}</td>
                    </tr>
                  ))}
                  {data.dailyBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        No daily data for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-ivory-dark/60 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By Payment Method</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ivory-dark/60 text-left text-[11px] uppercase tracking-wider font-medium text-gray-500">
                    <th className="py-3 pr-4">Method</th>
                    <th className="py-3 pr-4 text-right">Orders</th>
                    <th className="py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPaymentMethod.map((pm) => (
                    <tr key={pm.method} className="border-b border-ivory-dark/40 last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 capitalize">{pm.method}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-900">{pm.orders}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatPrice(pm.revenue)}</td>
                    </tr>
                  ))}
                  {data.byPaymentMethod.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        No payment data for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
