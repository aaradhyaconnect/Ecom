"use client";

import { useCallback, useEffect, useState, useRef, Fragment } from "react";
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
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Palette,
  Ruler,
  Download,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import toast from "react-hot-toast";
import type { Product, ColorOption, StockHistory } from "@/types";

interface InventoryItem extends Product {
  sizes: string[];
  colors: ColorOption[];
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [stockHistory, setStockHistory] = useState<Record<string, StockHistory[]>>({});
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({});
  const [historyExpanded, setHistoryExpanded] = useState<Set<string>>(new Set());

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
        setProducts(json.data.map((p: InventoryItem) => ({ ...p, _originalStock: p.stock })));
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

  const fetchStockHistory = useCallback(async (productId: string) => {
    setHistoryLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`/api/admin/inventory/history?product_id=${productId}`);
      const json = await res.json();
      if (json.success) {
        setStockHistory((prev) => ({ ...prev, [productId]: json.data }));
      }
    } catch {
      toast.error("Failed to load stock history");
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }, []);

  const toggleHistory = (productId: string) => {
    setHistoryExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
        if (!stockHistory[productId]) {
          fetchStockHistory(productId);
        }
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Category", "Price", "Stock", "Status", "Cost Price", "Stock Alert"];
    const rows = products.map((p) => {
      const stock = edits[p.id] ?? p.stock;
      const status = stock === 0 ? "Out of Stock" : stock <= (p.stock_alert || 5) ? "Low Stock" : "In Stock";
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        p.price,
        stock,
        status,
        p.cost_price ?? "",
        p.stock_alert ?? "",
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

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
      const updates = Object.entries(edits).map(([id, stock]) => ({
        id,
        stock,
        reason: reasons[id] || undefined,
      }));
      const res = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Updated ${updates.length} product(s)`);
        setEdits({});
        setReasons({});
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

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.stock_alert || 5)).length;
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
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
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
          <p className="text-[11px] text-charcoal-muted mt-0.5">Below alert threshold</p>
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
                <th className="px-5 py-3 font-medium w-8"></th>
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
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-charcoal-muted animate-spin" />
                      <p className="text-sm text-charcoal-muted">Loading inventory...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
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
                  const isExpanded = expanded.has(product.id);
                  const hasVariants = (product.sizes?.length > 0) || (product.colors?.length > 0);

                  return (
                    <Fragment key={product.id}>
                      <tr
                        className={cn(
                          "border-b border-ivory-dark/40 last:border-0 transition-colors",
                          isEdited && "bg-amber-50/30",
                          hasVariants && "cursor-pointer hover:bg-ivory-dark/20"
                        )}
                        onClick={() => hasVariants && toggleExpanded(product.id)}
                      >
                        <td className="px-5 py-3">
                          {hasVariants && (
                            <div className="text-charcoal-muted">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          )}
                        </td>
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
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
                                "w-16 h-7 text-center text-sm font-medium border rounded-md transition-colors bg-white",
                                isEdited ? "border-amber-400" : "border-ivory-dark/60",
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
                          ) : currentStock <= (product.stock_alert || 5) ? (
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

                      {/* Expanded Detail Row — Sizes, Colors, Cost Info, Reason, History */}
                      {isExpanded && hasVariants && (
                        <tr className="bg-ivory-dark/10">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="space-y-5">
                              <div className="flex flex-wrap gap-8">
                                {/* Sizes */}
                                {product.sizes?.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal uppercase tracking-wider">
                                      <Ruler className="h-3.5 w-3.5 text-charcoal-muted" />
                                      Sizes ({product.sizes.length})
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {product.sizes.map((size) => (
                                        <span
                                          key={size}
                                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium border border-ivory-dark/60 rounded-md bg-white text-charcoal"
                                        >
                                          {size}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Colors */}
                                {product.colors?.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal uppercase tracking-wider">
                                      <Palette className="h-3.5 w-3.5 text-charcoal-muted" />
                                      Colors ({product.colors.length})
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {product.colors.map((color) => (
                                        <div
                                          key={color.name}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-ivory-dark/60 rounded-md bg-white text-charcoal"
                                        >
                                          <span
                                            className="h-3 w-3 rounded-full border border-black/10 flex-shrink-0"
                                            style={{ backgroundColor: color.hex }}
                                          />
                                          {color.name}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Per-variant stock summary */}
                                {product.sizes?.length > 0 && product.colors?.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                                      Total Stock
                                    </div>
                                    <div className="text-sm font-semibold text-charcoal">
                                      {currentStock} units across {product.sizes.length} sizes &times; {product.colors.length} colors
                                    </div>
                                    <p className="text-[11px] text-charcoal-muted">
                                      Per-variant stock tracking coming soon. Currently tracking total stock only.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Cost Info & Values */}
                              <div className="flex flex-wrap gap-6 text-[13px]">
                                {(product.cost_price != null && product.cost_price > 0) && (
                                  <div>
                                    <span className="text-charcoal-muted">Cost Price: </span>
                                    <span className="font-medium text-charcoal">{formatPrice(product.cost_price)}</span>
                                  </div>
                                )}
                                {product.stock_alert > 0 && (
                                  <div>
                                    <span className="text-charcoal-muted">Low Stock Alert: </span>
                                    <span className="font-medium text-charcoal">{product.stock_alert} units</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-charcoal-muted">Retail Value: </span>
                                  <span className="font-medium text-charcoal">{formatPrice(currentStock * product.price)}</span>
                                </div>
                                {(product.cost_price != null && product.cost_price > 0) && (
                                  <div>
                                    <span className="text-charcoal-muted">Cost Value: </span>
                                    <span className="font-medium text-charcoal">{formatPrice(currentStock * product.cost_price)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Reason Input (shown when stock is edited) */}
                              {isEdited && currentStock !== originalStock && (
                                <div className="flex items-center gap-2 max-w-sm" onClick={(e) => e.stopPropagation()}>
                                  <FileText className="h-3.5 w-3.5 text-charcoal-muted flex-shrink-0" />
                                  <Input
                                    placeholder="Reason for adjustment..."
                                    value={reasons[product.id] || ""}
                                    onChange={(e) => setReasons((prev) => ({ ...prev, [product.id]: e.target.value }))}
                                    className="text-xs"
                                  />
                                </div>
                              )}

                              {/* Stock History */}
                              <div className="border-t border-ivory-dark/40 pt-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleHistory(product.id); }}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-charcoal uppercase tracking-wider hover:text-gold-dark transition-colors"
                                >
                                  <Clock className="h-3.5 w-3.5 text-charcoal-muted" />
                                  Stock History
                                  {historyExpanded.has(product.id) ? (
                                    <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                                  )}
                                </button>

                                {historyExpanded.has(product.id) && (
                                  <div className="mt-3">
                                    {historyLoading[product.id] ? (
                                      <p className="text-xs text-charcoal-muted">Loading history...</p>
                                    ) : stockHistory[product.id]?.length === 0 ? (
                                      <p className="text-xs text-charcoal-muted">No stock history yet.</p>
                                    ) : (
                                      <div className="bg-white border border-ivory-dark/60 rounded-lg overflow-hidden">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[10px] text-charcoal-muted uppercase tracking-wider">
                                              <th className="px-3 py-2 font-medium">Date</th>
                                              <th className="px-3 py-2 font-medium">Type</th>
                                              <th className="px-3 py-2 font-medium">Before → After</th>
                                              <th className="px-3 py-2 font-medium">Change</th>
                                              <th className="px-3 py-2 font-medium">Reason</th>
                                              <th className="px-3 py-2 font-medium">By</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {stockHistory[product.id].map((h) => (
                                              <tr key={h.id} className="border-b border-ivory-dark/30 last:border-0">
                                                <td className="px-3 py-2 text-charcoal-muted whitespace-nowrap">
                                                  {new Date(h.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="px-3 py-2">
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-ivory-dark/40 text-charcoal capitalize">
                                                    {h.change_type}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-charcoal whitespace-nowrap">
                                                  {h.quantity_before} → {h.quantity_after}
                                                </td>
                                                <td className="px-3 py-2 font-medium whitespace-nowrap">
                                                  <span className={cn(h.quantity_change > 0 ? "text-green-600" : "text-rose-600")}>
                                                    {h.quantity_change > 0 ? "+" : ""}{h.quantity_change}
                                                  </span>
                                                </td>
                                                <td className="px-3 py-2 text-charcoal-muted max-w-[150px] truncate">
                                                  {h.reason || "—"}
                                                </td>
                                                <td className="px-3 py-2 text-charcoal-muted max-w-[100px] truncate">
                                                  {h.performed_by ? h.performed_by.slice(0, 8) + "…" : "—"}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
