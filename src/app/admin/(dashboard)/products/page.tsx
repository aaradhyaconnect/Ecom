"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { MultiImageUpload } from "@/components/ui/ImageUpload";
import { useDebounce } from "@/hooks/useDebounce";
import { usePolling } from "@/hooks/usePolling";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { CATEGORIES, SIZES } from "@/lib/constants/categories";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Product, ColorOption } from "@/types";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  compare_price: string;
  category: string;
  subcategory: string;
  sizes: string[];
  colors: ColorOption[];
  images: string[];
  tags: string;
  stock: string;
  material: string;
  care_instructions: string;
  is_new: boolean;
  is_best_seller: boolean;
  is_sale: boolean;
  sku: string;
  barcode: string;
  seo_title: string;
  seo_description: string;
  status: "draft" | "published" | "archived";
  cost_price: string;
  stock_alert: string;
  video_url: string;
  is_prebook: boolean;
  prebook_amount: string;
  prebook_note: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  compare_price: "",
  category: "new-arrivals",
  subcategory: "",
  sizes: [],
  colors: [],
  images: [],
  tags: "",
  stock: "0",
  material: "",
  care_instructions: "",
  is_new: false,
  is_best_seller: false,
  is_sale: false,
  sku: "",
  barcode: "",
  seo_title: "",
  seo_description: "",
  status: "published",
  cost_price: "",
  stock_alert: "5",
  video_url: "",
  is_prebook: false,
  prebook_amount: "",
  prebook_note: "",
};

const ITEMS_PER_PAGE = 12;

export default function AdminProductsPage() {
  const { hasPerm } = useAdminPermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);

  const search = useDebounce(searchInput, 300);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(ITEMS_PER_PAGE));
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, category, statusFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  usePolling(fetchProducts, 30000, !showModal);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    let parsedColors: { name: string; hex: string }[] = [];
    if (Array.isArray(product.colors)) {
      parsedColors = product.colors;
    } else if (typeof product.colors === "string") {
      try { parsedColors = JSON.parse(product.colors); } catch { parsedColors = []; }
    }
    let parsedSizes: string[] = [];
    if (Array.isArray(product.sizes)) {
      parsedSizes = product.sizes;
    } else if (typeof product.sizes === "string") {
      try { parsedSizes = JSON.parse(product.sizes); } catch { parsedSizes = []; }
    }
    let parsedTags: string[] = [];
    if (Array.isArray(product.tags)) {
      parsedTags = product.tags;
    } else if (typeof product.tags === "string") {
      try { parsedTags = JSON.parse(product.tags); } catch { parsedTags = []; }
    }
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compare_price: product.compare_price ? String(product.compare_price) : "",
      category: product.category,
      subcategory: product.subcategory || "",
      sizes: parsedSizes,
      colors: parsedColors,
      images: product.images?.length > 0 ? product.images : [],
      tags: parsedTags.join(", "),
      stock: String(product.stock),
      material: product.material || "",
      care_instructions: product.care_instructions || "",
      is_new: product.is_new,
      is_best_seller: product.is_best_seller,
      is_sale: product.is_sale,
      sku: product.sku || "",
      barcode: product.barcode || "",
      seo_title: product.seo_title || "",
      seo_description: product.seo_description || "",
      status: product.status || "published",
      cost_price: product.cost_price?.toString() || "",
      stock_alert: product.stock_alert?.toString() || "5",
      video_url: product.video_url || "",
      is_prebook: product.is_prebook || false,
      prebook_amount: product.prebook_amount?.toString() || "",
      prebook_note: product.prebook_note || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Name and price are required");
      return;
    }

    if (form.is_prebook && (!form.prebook_amount || parseFloat(form.prebook_amount) <= 0)) {
      toast.error("Pre-book amount is required when Pre-Book is enabled");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        images: form.images.filter(Boolean),
        colors: form.colors,
        compare_price: form.compare_price || null,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        seo_title: form.seo_title || undefined,
        seo_description: form.seo_description || undefined,
        status: form.status,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : undefined,
        stock_alert: parseInt(form.stock_alert) || 5,
        video_url: form.video_url || undefined,
        is_prebook: form.is_prebook,
        prebook_amount: form.is_prebook && form.prebook_amount ? parseFloat(form.prebook_amount) : null,
        prebook_note: form.is_prebook ? form.prebook_note || null : null,
        ...(editingProduct ? { id: editingProduct.id } : {}),
      };

      const res = await fetch("/api/admin/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingProduct ? "Product updated" : "Product created");
        setShowModal(false);
        fetchProducts();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`))
      return;

    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} product(s)? This cannot be undone.`))
      return;

    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/products?id=${id}`, { method: "DELETE" }).then((r) => r.json())
        )
      );
      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = selectedIds.size - succeeded;

      if (succeeded > 0) toast.success(`${succeeded} product(s) deleted`);
      if (failed > 0) toast.error(`${failed} product(s) failed to delete`);

      setSelectedIds(new Set());
      fetchProducts();
    } catch {
      toast.error("Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleInlineEdit = async (product: Product, field: string, value: string) => {
    const numValue = Number(value);
    if (field === "stock" && (isNaN(numValue) || numValue < 0)) {
      toast.error("Stock must be a non-negative number");
      setEditingField(null);
      return;
    }
    if (field === "price" && (isNaN(numValue) || numValue <= 0)) {
      toast.error("Price must be a positive number");
      setEditingField(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, [field]: field === "stock" || field === "price" ? numValue : value }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
        fetchProducts();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setEditingField(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const addColor = () => {
    setForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: "", hex: "#000000" }],
    }));
  };

  const updateColor = (index: number, field: keyof ColorOption, value: string) => {
    setForm((prev) => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], [field]: value };
      return { ...prev, colors };
    });
  };

  const removeColor = (index: number) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">
            Product Management
          </p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Products</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">
            {total} product{total !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && hasPerm("products", "delete") && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              isLoading={bulkDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedIds.size})
            </Button>
          )}
          {hasPerm("products", "create") && (
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "", label: "All Categories" },
            ...CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "", label: "All Status" },
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "archived", label: "Archived" },
          ]}
        />
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="flex items-center justify-center">
                    {selectedIds.size === products.length && products.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-gold-dark" />
                    ) : selectedIds.size > 0 ? (
                      <MinusSquare className="h-4 w-4 text-gold-dark" />
                    ) : (
                      <Square className="h-4 w-4 text-charcoal-muted/40" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-ivory-dark/40">
                    <td className="px-4 py-3"><div className="h-4 w-4 bg-ivory-dark rounded animate-pulse" /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-ivory-dark rounded-lg animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-ivory-dark rounded-lg animate-pulse" />
                          <div className="h-3 w-20 bg-ivory-dark rounded-lg animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><div className="h-4 w-16 bg-ivory-dark rounded-lg animate-pulse" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-14 bg-ivory-dark rounded-lg animate-pulse" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-8 bg-ivory-dark rounded-lg animate-pulse" /></td>
                    <td className="px-5 py-3"><div className="h-5 w-12 bg-ivory-dark rounded-full animate-pulse" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-16 bg-ivory-dark rounded-lg animate-pulse" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-16 bg-ivory-dark rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-charcoal-muted/30" />
                    <p className="text-sm font-medium text-charcoal-muted">No products found</p>
                    <p className="text-xs text-charcoal-muted mt-1">
                      {search || category ? "Try adjusting your filters" : "Add your first product to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors ${
                      selectedIds.has(product.id) ? "bg-gold/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(product.id)} className="flex items-center justify-center">
                        {selectedIds.has(product.id) ? (
                          <CheckSquare className="h-4 w-4 text-gold-dark" />
                        ) : (
                          <Square className="h-4 w-4 text-charcoal-muted/30" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-ivory-dark rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-charcoal-muted m-auto mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px] text-charcoal">
                            {product.name}
                          </p>
                          <p className="text-xs text-charcoal-muted">{product.slug}</p>
                          {product.sku && (
                            <p className="text-[11px] text-charcoal-muted/70">SKU: {product.sku}</p>
                          )}
                          <div className="flex gap-1 mt-1">
                            {product.is_new && <Badge variant="new">New</Badge>}
                            {product.is_best_seller && <Badge variant="best">Best</Badge>}
                            {product.is_sale && <Badge variant="sale">Sale</Badge>}
                            {product.is_prebook && <Badge variant="warning">Pre-Book</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-charcoal-muted capitalize text-xs">
                      {product.category.replace("-", " ")}
                    </td>
                    <td className="px-5 py-3">
                      {editingField?.id === product.id && editingField.field === "price" ? (
                        <input
                          key={`price-${product.id}-${product.price}`}
                          autoFocus
                          type="number"
                          defaultValue={product.price}
                          className="w-20 border border-gold/60 rounded px-2 py-1 text-sm bg-ivory focus:ring-0 focus:border-gold"
                          onBlur={(e) => handleInlineEdit(product, "price", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleInlineEdit(product, "price", e.currentTarget.value);
                            if (e.key === "Escape") setEditingField(null);
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingField({ id: product.id, field: "price" });
                          }}
                          className="font-medium text-charcoal hover:text-gold-dark transition-colors cursor-pointer"
                          title="Click to edit price"
                        >
                          {formatPrice(product.price)}
                          {product.compare_price && (
                            <span className="ml-1 text-xs text-charcoal-muted line-through">
                              {formatPrice(product.compare_price)}
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editingField?.id === product.id && editingField.field === "stock" ? (
                        <input
                          key={`stock-${product.id}-${product.stock}`}
                          autoFocus
                          type="number"
                          defaultValue={product.stock}
                          className="w-16 border border-gold/60 rounded px-2 py-1 text-sm bg-ivory focus:ring-0 focus:border-gold"
                          onBlur={(e) => handleInlineEdit(product, "stock", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleInlineEdit(product, "stock", e.currentTarget.value);
                            if (e.key === "Escape") setEditingField(null);
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingField({ id: product.id, field: "stock" });
                          }}
                          className={`font-medium cursor-pointer hover:underline transition-colors ${
                            product.stock > 0 ? "text-green-600" : "text-rose-500"
                          }`}
                          title="Click to edit stock"
                        >
                          {product.stock}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          product.status === "published"
                            ? "success"
                            : product.status === "archived"
                            ? "error"
                            : "default"
                        }
                      >
                        {product.status || "published"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-charcoal-muted text-xs">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {hasPerm("products", "edit") && (
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors rounded"
                            title="Edit product"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {hasPerm("products", "delete") && (
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-charcoal-muted hover:bg-rose-50 hover:text-rose-500 transition-colors rounded"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-charcoal-muted">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium border border-ivory-dark rounded-lg hover:bg-ivory-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                    page === pageNum
                      ? "bg-charcoal text-ivory"
                      : "border border-ivory-dark hover:bg-ivory-dark"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-medium border border-ivory-dark rounded-lg hover:bg-ivory-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input
            label="Product Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-ivory-dark rounded-lg px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              required
            />
            <Input
              label="Compare Price (₹)"
              type="number"
              value={form.compare_price}
              onChange={(e) => setForm((prev) => ({ ...prev, compare_price: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Input
              label="Subcategory"
              value={form.subcategory}
              onChange={(e) => setForm((prev) => ({ ...prev, subcategory: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors ${
                    form.sizes.includes(size)
                      ? "bg-charcoal text-ivory border-charcoal"
                      : "bg-ivory text-charcoal border-ivory-dark hover:border-charcoal"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">Colors</label>
              <button
                type="button"
                onClick={addColor}
                className="text-xs text-charcoal hover:text-gold-dark transition-colors"
              >
                + Add Color
              </button>
            </div>
            <div className="space-y-2">
              {form.colors.map((color, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Color name"
                    value={color.name}
                    onChange={(e) => updateColor(i, "name", e.target.value)}
                  />
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(i, "hex", e.target.value)}
                    className="h-9 w-9 border border-ivory-dark rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(i)}
                    className="p-1 text-charcoal-muted hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <MultiImageUpload
            label="Product Images"
            value={form.images.filter(Boolean)}
            onChange={(urls) => setForm((prev) => ({ ...prev, images: urls.length > 0 ? urls : [] }))}
            folder="products"
            maxImages={10}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock"
              type="number"
              step="1"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
            />
            <Input
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="summer, trendy, casual"
            />
          </div>

          <div className="border-t border-ivory-dark/60 pt-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-3">Inventory</p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU"
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g. HNJ-001"
              />
              <Input
                label="Barcode"
                value={form.barcode}
                onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))}
                placeholder="UPC / EAN code"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Cost Price (₹)"
                type="number"
                value={form.cost_price}
                onChange={(e) => setForm((prev) => ({ ...prev, cost_price: e.target.value }))}
                placeholder="Supplier cost"
              />
              <Input
                label="Low Stock Alert"
                type="number"
                value={form.stock_alert}
                onChange={(e) => setForm((prev) => ({ ...prev, stock_alert: e.target.value }))}
              />
            </div>
          </div>

          <Input
            label="Material"
            value={form.material}
            onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Care Instructions
            </label>
            <textarea
              value={form.care_instructions}
              onChange={(e) => setForm((prev) => ({ ...prev, care_instructions: e.target.value }))}
              rows={2}
              className="w-full border border-ivory-dark rounded-lg px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_new}
                onChange={(e) => setForm((prev) => ({ ...prev, is_new: e.target.checked }))}
                className="border-ivory-dark rounded accent-charcoal"
              />
              <span className="text-sm text-charcoal">New Arrival</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_best_seller}
                onChange={(e) => setForm((prev) => ({ ...prev, is_best_seller: e.target.checked }))}
                className="border-ivory-dark rounded accent-charcoal"
              />
              <span className="text-sm text-charcoal">Best Seller</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_sale}
                onChange={(e) => setForm((prev) => ({ ...prev, is_sale: e.target.checked }))}
                className="border-ivory-dark rounded accent-charcoal"
              />
              <span className="text-sm text-charcoal">On Sale</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_prebook}
                onChange={(e) => setForm((prev) => ({ ...prev, is_prebook: e.target.checked }))}
                className="border-ivory-dark rounded accent-charcoal"
              />
              <span className="text-sm text-charcoal">Pre-Book Available</span>
            </label>
          </div>

          {form.is_prebook && (
            <div className="grid grid-cols-2 gap-4 bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <Input
                label="Pre-Book Amount (₹)"
                type="number"
                value={form.prebook_amount}
                onChange={(e) => setForm((prev) => ({ ...prev, prebook_amount: e.target.value }))}
                placeholder="Deposit amount customer pays now"
              />
              <Input
                label="Pre-Book Note"
                value={form.prebook_note}
                onChange={(e) => setForm((prev) => ({ ...prev, prebook_note: e.target.value }))}
                placeholder="e.g. Ships in 2-3 weeks"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProductForm["status"] }))}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <Input
              label="Video URL"
              value={form.video_url}
              onChange={(e) => setForm((prev) => ({ ...prev, video_url: e.target.value }))}
              placeholder="YouTube / Vimeo link"
            />
          </div>

          <details className="border-t border-ivory-dark/60 pt-4 group">
            <summary className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium cursor-pointer select-none list-none flex items-center gap-1 before:content-['▸'] before:text-xs group-open:before:content-['▾']">
              SEO
            </summary>
            <div className="space-y-4 mt-4">
              <Input
                label="SEO Title"
                value={form.seo_title}
                onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
                placeholder="Optimized title for search engines"
              />
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  SEO Description
                </label>
                <textarea
                  value={form.seo_description}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
                  rows={3}
                  placeholder="Meta description for search results (150-160 chars recommended)"
                  className="w-full border border-ivory-dark rounded-lg px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-gray-900"
                />
              </div>
            </div>
          </details>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-ivory-dark/60 pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {editingProduct ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
