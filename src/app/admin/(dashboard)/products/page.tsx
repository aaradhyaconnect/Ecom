"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { CATEGORIES, SIZES } from "@/lib/constants/categories";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
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
  video_url: string;
  tags: string;
  stock: string;
  material: string;
  care_instructions: string;
  is_new: boolean;
  is_best_seller: boolean;
  is_sale: boolean;
  sale_percent: string;
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
  images: [""],
  video_url: "",
  tags: "",
  stock: "0",
  material: "",
  care_instructions: "",
  is_new: false,
  is_best_seller: false,
  is_sale: false,
  sale_percent: "",
};

const ITEMS_PER_PAGE = 12;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [search, category, page]);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compare_price: product.compare_price ? String(product.compare_price) : "",
      category: product.category,
      subcategory: product.subcategory || "",
      sizes: product.sizes,
      colors: product.colors,
      images: product.images.length > 0 ? product.images : [""],
      video_url: product.video_url || "",
      tags: product.tags.join(", "),
      stock: String(product.stock),
      material: product.material || "",
      care_instructions: product.care_instructions || "",
      is_new: product.is_new,
      is_best_seller: product.is_best_seller,
      is_sale: product.is_sale,
      sale_percent: product.sale_percent ? String(product.sale_percent) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Name and price are required");
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
        sale_percent: form.sale_percent || null,
        ...(editingProduct ? { id: editingProduct.id } : {}),
      };

      const res = await fetch(
        editingProduct ? `/api/admin/products` : `/api/admin/products`,
        {
          method: editingProduct ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

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

  const addImage = () => {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const updateImage = (index: number, value: string) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Products</h1>
          <p className="text-sm text-charcoal-muted">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-ivory-dark py-2.5 pl-10 pr-4 text-sm focus:border-gold/60 focus:ring-0 outline-none transition-colors bg-ivory text-charcoal placeholder:text-charcoal-muted"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="border border-ivory-dark py-2.5 px-3 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-ivory-dark bg-ivory overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark bg-ivory-dark text-left text-xs font-medium text-charcoal-muted uppercase tracking-wider">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-ivory-dark">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-ivory-dark animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-ivory-dark rounded animate-pulse" />
                          <div className="h-3 w-20 bg-ivory-dark rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-ivory-dark rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-14 bg-ivory-dark rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-ivory-dark rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-12 bg-ivory-dark rounded-full animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-ivory-dark rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-ivory-dark rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted">
                    <Package className="mx-auto mb-2 h-8 w-8" />
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-ivory-dark last:border-0 hover:bg-ivory-dark/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-ivory-dark flex items-center justify-center overflow-hidden">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-charcoal-muted" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px] text-charcoal">
                            {product.name}
                          </p>
                          <p className="text-xs text-charcoal-muted">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-muted capitalize">
                      {product.category.replace("-", " ")}
                    </td>
                    <td className="px-4 py-3 font-medium text-charcoal">
                      {formatPrice(product.price)}
                      {product.compare_price && (
                        <span className="ml-1 text-xs text-charcoal-muted line-through">
                          {formatPrice(product.compare_price)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.stock > 0
                            ? "text-green-600"
                            : "text-rose-500"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {product.is_new && <Badge variant="new">New</Badge>}
                        {product.is_best_seller && (
                          <Badge variant="best">Best</Badge>
                        )}
                        {product.is_sale && <Badge variant="sale">Sale</Badge>}
                        {!product.is_new &&
                          !product.is_best_seller &&
                          !product.is_sale && (
                            <span className="text-xs text-charcoal-muted">-</span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-muted text-xs">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-charcoal-muted hover:bg-rose-50 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
              className="px-3 py-1.5 text-sm font-medium border border-ivory-dark hover:bg-ivory-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                  className={`w-9 h-9 text-sm font-medium transition-colors ${
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
              className="px-3 py-1.5 text-sm font-medium border border-ivory-dark hover:bg-ivory-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full border border-ivory-dark px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Input
              label="Compare Price (₹)"
              type="number"
              value={form.compare_price}
              onChange={(e) =>
                setForm({ ...form, compare_price: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
            <Input
              label="Subcategory"
              value={form.subcategory}
              onChange={(e) =>
                setForm({ ...form, subcategory: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 text-sm font-medium border transition-colors ${
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
              <label className="block text-sm font-medium text-charcoal">
                Colors
              </label>
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
                    className="h-9 w-9 border border-ivory-dark cursor-pointer"
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-charcoal">
                Images (URLs)
              </label>
              <button
                type="button"
                onClick={addImage}
                className="text-xs text-charcoal hover:text-gold-dark transition-colors"
              >
                + Add Image
              </button>
            </div>
            <div className="space-y-2">
              {form.images.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={url}
                    onChange={(e) => updateImage(i, e.target.value)}
                  />
                  {form.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-1 text-charcoal-muted hover:text-rose-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {url && (
                    <div className="h-9 w-9 border border-ivory-dark overflow-hidden flex-shrink-0">
                      <Image
                        src={url}
                        alt="Product preview"
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Video URL (YouTube/Vimeo)"
            placeholder="https://www.youtube.com/watch?v=..."
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <Input
              label="Sale %"
              type="number"
              value={form.sale_percent}
              onChange={(e) =>
                setForm({ ...form, sale_percent: e.target.value })
              }
            />
          </div>

          <Input
            label="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="summer, trendy, casual"
          />

          <Input
            label="Material"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Care Instructions
            </label>
            <textarea
              value={form.care_instructions}
              onChange={(e) =>
                setForm({ ...form, care_instructions: e.target.value })
              }
              rows={2}
              className="w-full border border-ivory-dark px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_new}
                onChange={(e) =>
                  setForm({ ...form, is_new: e.target.checked })
                }
                className="border-ivory-dark accent-charcoal"
              />
              <span className="text-sm text-charcoal">New Arrival</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_best_seller}
                onChange={(e) =>
                  setForm({ ...form, is_best_seller: e.target.checked })
                }
                className="border-ivory-dark accent-charcoal"
              />
              <span className="text-sm text-charcoal">Best Seller</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_sale}
                onChange={(e) =>
                  setForm({ ...form, is_sale: e.target.checked })
                }
                className="border-ivory-dark accent-charcoal"
              />
              <span className="text-sm text-charcoal">On Sale</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
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
