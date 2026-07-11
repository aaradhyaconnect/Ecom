"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  Loader2,
  AlertTriangle,
  XCircle,
  Package,
  Tag,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";

interface Summary {
  totalProducts: number;
  totalStockValueCost: number;
  totalStockValueRetail: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  costPrice: number;
}

interface CategoryBreakdown {
  category: string;
  productCount: number;
  totalStock: number;
}

interface InventoryData {
  summary: Summary;
  lowStock: LowStockItem[];
  outOfStock: LowStockItem[];
  categoryBreakdown: CategoryBreakdown[];
}

export default function InventoryReportPage() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/admin/reports/inventory");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-white/40">
        <Boxes className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Failed to load inventory data.</p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total Products",
      value: data.summary.totalProducts,
      icon: Package,
    },
    {
      label: "Stock Value (Cost)",
      value: formatPrice(data.summary.totalStockValueCost),
      icon: Tag,
    },
    {
      label: "Stock Value (Retail)",
      value: formatPrice(data.summary.totalStockValueRetail),
      icon: Tag,
    },
    {
      label: "Low Stock",
      value: data.summary.lowStockCount,
      icon: AlertTriangle,
      highlight: data.summary.lowStockCount > 0,
    },
    {
      label: "Out of Stock",
      value: data.summary.outOfStockCount,
      icon: XCircle,
      highlight: data.summary.outOfStockCount > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 p-5 rounded-xl",
              card.highlight && "border-yellow-400/50 dark:border-yellow-400/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gold/10 p-2 rounded-lg">
                <card.icon className="h-4 w-4 text-gold-dark" />
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Low Stock ({data.lowStock.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ivory-dark/60 dark:border-white/10 text-left text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-white/40">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4 text-right">Stock</th>
                  <th className="py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-ivory-dark/40 dark:border-white/5 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-white/40 font-mono text-xs">
                      {item.sku}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Badge variant="warning">{item.currentStock}</Badge>
                    </td>
                    <td className="py-3 text-right text-gray-900 dark:text-white">
                      {formatPrice(item.costPrice)}
                    </td>
                  </tr>
                ))}
                {data.lowStock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-white/40">
                      All products are well stocked.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            Out of Stock ({data.outOfStock.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ivory-dark/60 dark:border-white/10 text-left text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-white/40">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.outOfStock.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-ivory-dark/40 dark:border-white/5 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-white/40 font-mono text-xs">
                      {item.sku}
                    </td>
                    <td className="py-3 text-right text-gray-900 dark:text-white">
                      {formatPrice(item.costPrice)}
                    </td>
                  </tr>
                ))}
                {data.outOfStock.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-white/40">
                      No out of stock products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Category Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 dark:border-white/10 text-left text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-white/40">
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4 text-right">Products</th>
                <th className="py-3 text-right">Total Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.categoryBreakdown.map((cat) => (
                <tr
                  key={cat.category}
                  className="border-b border-ivory-dark/40 dark:border-white/5 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white capitalize">
                    {cat.category}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-900 dark:text-white">
                    {cat.productCount}
                  </td>
                  <td className="py-3 text-right text-gray-900 dark:text-white">
                    {cat.totalStock}
                  </td>
                </tr>
              ))}
              {data.categoryBreakdown.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-white/40">
                    No category data.
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
