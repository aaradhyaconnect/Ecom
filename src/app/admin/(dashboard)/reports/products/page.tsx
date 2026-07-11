"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  revenue: number;
  orders: number;
  currentStock: number;
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

export default function ProductsReportPage() {
  const defaults = getDefaultDates();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports/products?from=${from}&to=${to}&limit=50`
      );
      const json = await res.json();
      if (json.success) {
        const sorted = [...json.data].sort(
          (a: ProductRow, b: ProductRow) => b.revenue - a.revenue
        );
        setProducts(sorted);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

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
        <Button onClick={fetchProducts} isLoading={loading} variant="secondary" size="sm">
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No product sales data for this period.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="bg-white border border-ivory-dark/60 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Product Sales ({products.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ivory-dark/60 text-left text-[11px] uppercase tracking-wider font-medium text-gray-500">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4 text-right">Sold</th>
                  <th className="py-3 pr-4 text-right">Revenue</th>
                  <th className="py-3 pr-4 text-right">Orders</th>
                  <th className="py-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-ivory-dark/40 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-gray-900">{p.name}</td>
                    <td className="py-3 pr-4 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="py-3 pr-4 text-right text-gray-900">{p.totalSold}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-900">{formatPrice(p.revenue)}</td>
                    <td className="py-3 pr-4 text-right text-gray-900">{p.orders}</td>
                    <td className="py-3 text-right">
                      <span
                        className={cn(
                          "font-medium",
                          p.currentStock <= 0
                            ? "text-red-500"
                            : p.currentStock <= 10
                            ? "text-yellow-500"
                            : "text-gray-900"
                        )}
                      >
                        {p.currentStock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
