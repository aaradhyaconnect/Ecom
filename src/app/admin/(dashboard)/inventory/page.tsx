"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  Warehouse,
  AlertTriangle,
  PackageX,
  Check,
  Minus,
  Plus,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import toast from "react-hot-toast";
import type { Product } from "@/types";

interface InventoryItem extends Product {
  _originalStock?: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("filter", filter);
      params.set("limit", "100");

      const res = await fetch(`/api/admin/inventory?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.map((p: Product) => ({ ...p, _originalStock: p.stock })));
        setTotal(json.total);
      }
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStockChange = (id: string, delta: number) => {
    setEdits((prev) => {
      const current = prev[id] ?? products.find((p) => p.id === id)?.stock ?? 0;
      return { ...prev, [id]: Math.max(0, current + delta) };
    });
  };

  const handleStockInput = (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setEdits((prev) => ({ ...prev, [id]: num }));
    }
  };

  const hasChanges = Object.keys(edits).length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(edits).map(([id, stock]) => ({ id, stock }));
      const res = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Updated ${updates.length} product(s)`);
        setEdits({});
        fetchProducts();
      } else {
        toast.error(json.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-charcoal-muted">
            Manage stock levels for all products
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : `Save ${Object.keys(edits).length} change(s)`}
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "border p-4 text-left transition-colors",
            filter === "all" ? "border-charcoal bg-charcoal text-ivory" : "bg-ivory hover:bg-ivory-dark/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            <span className="text-sm font-medium">All Products</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </button>
        <button
          onClick={() => setFilter("low")}
          className={cn(
            "border p-4 text-left transition-colors",
            filter === "low" ? "border-amber-500 bg-amber-50 text-amber-900" : "bg-ivory hover:bg-ivory-dark/50"
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Low Stock</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{lowStockCount}</p>
        </button>
        <button
          onClick={() => setFilter("out")}
          className={cn(
            "border p-4 text-left transition-colors",
            filter === "out" ? "border-rose-500 bg-rose-50 text-rose-900" : "bg-ivory hover:bg-ivory-dark/50"
          )}
        >
          <div className="flex items-center gap-2">
            <PackageX className="h-4 w-4" />
            <span className="text-sm font-medium">Out of Stock</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{outOfStockCount}</p>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted/60" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border bg-ivory overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ivory-dark/50 text-left text-xs text-charcoal-muted">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium text-center">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-charcoal-muted/60">
                    Loading inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-charcoal-muted/60">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const currentStock = edits[product.id] ?? product.stock;
                  const isEdited = product.id in edits;
                  const originalStock = product._originalStock ?? product.stock;

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        isEdited && "bg-amber-50/50"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-ivory-dark overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <PackageX className="h-4 w-4 text-charcoal-muted/60" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">
                              {product.name}
                            </p>
                            <div className="flex gap-1 mt-0.5">
                              {product.is_new && <Badge variant="new" className="text-[9px] px-1 py-0">New</Badge>}
                              {product.is_best_seller && <Badge variant="best" className="text-[9px] px-1 py-0">Best</Badge>}
                              {product.is_sale && <Badge variant="sale" className="text-[9px] px-1 py-0">Sale</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-charcoal-muted capitalize">
                        {product.category.replace(/-/g, " ")}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStockChange(product.id, -1)}
                            className="h-7 w-7 border border-ivory-dark flex items-center justify-center hover:bg-ivory-dark transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={currentStock}
                            onChange={(e) => handleStockInput(product.id, e.target.value)}
                            className={cn(
                              "w-16 h-7 text-center text-sm font-medium border transition-colors",
                              isEdited ? "border-amber-400 bg-ivory" : "border-ivory-dark",
                              currentStock === 0 && "text-rose-500",
                              currentStock > 0 && currentStock <= 5 && "text-amber-600"
                            )}
                          />
                          <button
                            onClick={() => handleStockChange(product.id, 1)}
                            className="h-7 w-7 border border-ivory-dark flex items-center justify-center hover:bg-ivory-dark transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {currentStock === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                            <PackageX className="h-3 w-3" /> Out of Stock
                          </span>
                        ) : currentStock <= 5 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <Check className="h-3 w-3" /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEdited && currentStock !== originalStock && (
                          <span className="text-xs text-amber-600 font-medium">
                            {originalStock} &rarr; {currentStock}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
