"use client";

import { useCallback, useEffect, useState, useRef } from "react";
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
  Package,
  RefreshCw,
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
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
  }, [debouncedSearch, filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Stock</span>
          <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Inventory</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">
            Manage stock levels for all products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} isLoading={saving} size="sm">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save {Object.keys(edits).length} change(s)
            </Button>
          )}
        </div>
      </div>

      {/* Filter Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "border p-5 text-left transition-all duration-200 rounded-xl",
            filter === "all"
              ? "border-charcoal bg-charcoal text-ivory shadow-sm"
              : "bg-white border-ivory-dark/60 hover:border-ivory-dark hover:shadow-sm"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "p-2 rounded-lg",
              filter === "all" ? "bg-ivory/20" : "bg-ivory-dark/50"
            )}>
              <Warehouse className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">All Products</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{total}</p>
        </button>

        <button
          onClick={() => setFilter("low")}
          className={cn(
            "border p-5 text-left transition-all duration-200 rounded-xl",
            filter === "low"
              ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm"
              : "bg-white border-ivory-dark/60 hover:border-amber-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "p-2 rounded-lg",
              filter === "low" ? "bg-amber-100" : "bg-amber-50"
            )}>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm font-medium">Low Stock</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{lowStockCount}</p>
          <p className="text-[11px] text-charcoal-muted mt-0.5">1-5 units remaining</p>
        </button>

        <button
          onClick={() => setFilter("out")}
          className={cn(
            "border p-5 text-left transition-all duration-200 rounded-xl",
            filter === "out"
              ? "border-rose-400 bg-rose-50 text-rose-900 shadow-sm"
              : "bg-white border-ivory-dark/60 hover:border-rose-300 hover:shadow-sm"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "p-2 rounded-lg",
              filter === "out" ? "bg-rose-100" : "bg-rose-50"
            )}>
              <PackageX className="h-4 w-4 text-rose-600" />
            </div>
            <span className="text-sm font-medium">Out of Stock</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">{outOfStockCount}</p>
          <p className="text-[11px] text-charcoal-muted mt-0.5">0 units remaining</p>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] text-charcoal-muted uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium text-center">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Changes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-charcoal-muted animate-spin" />
                      <p className="text-sm text-charcoal-muted">Loading inventory...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-charcoal-muted" />
                      <p className="text-sm text-charcoal-muted">No products found</p>
                    </div>
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
                        "border-b border-ivory-dark/40 last:border-0 transition-colors",
                        isEdited && "bg-amber-50/30"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-ivory-dark/50 overflow-hidden flex-shrink-0 rounded-lg">
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
                                <Package className="h-4 w-4 text-charcoal-muted" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[200px] text-charcoal">
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
                      <td className="px-5 py-3 text-charcoal-muted capitalize text-[13px]">
                        {product.category.replace(/-/g, " ")}
                      </td>
                      <td className="px-5 py-3 font-medium text-[13px]">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStockChange(product.id, -1)}
                            className="h-7 w-7 border border-ivory-dark/60 flex items-center justify-center hover:bg-ivory-dark/40 transition-colors rounded-md"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={currentStock}
                            onChange={(e) => handleStockInput(product.id, e.target.value)}
                            className={cn(
                              "w-16 h-7 text-center text-sm font-medium border rounded-md transition-colors",
                              isEdited ? "border-amber-400 bg-ivory" : "border-ivory-dark/60",
                              currentStock === 0 && "text-rose-500",
                              currentStock > 0 && currentStock <= 5 && "text-amber-600"
                            )}
                          />
                          <button
                            onClick={() => handleStockChange(product.id, 1)}
                            className="h-7 w-7 border border-ivory-dark/60 flex items-center justify-center hover:bg-ivory-dark/40 transition-colors rounded-md"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {currentStock === 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                            <PackageX className="h-3 w-3" /> Out of Stock
                          </span>
                        ) : currentStock <= 5 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <Check className="h-3 w-3" /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEdited && currentStock !== originalStock && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
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
