"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { MultiImageUpload } from "@/components/ui/ImageUpload";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils/cn";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Category } from "@/types";

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sort_order: "0",
  is_active: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const search = useDebounce(searchInput, 300);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        const sorted = [...data.data].sort(
          (a: Category, b: Category) => a.sort_order - b.sort_order
        );
        setCategories(sorted);
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, [fetchCategories]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingCategory(null);
    setForm({ ...emptyForm, sort_order: String(categories.length + 1) });
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      sort_order: String(category.sort_order),
      is_active: category.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: form.description || null,
        image: form.image || null,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
        ...(editingCategory ? { id: editingCategory.id } : {}),
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";

      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCategory ? "Category updated" : "Category created");
        setShowModal(false);
        fetchCategories();
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category deleted");
        fetchCategories();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !category.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Category ${category.is_active ? "deactivated" : "activated"}`);
        fetchCategories();
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const moveCategory = async (index: number, direction: "up" | "down") => {
    const list = [...filtered];
    const sourceIdx = categories.indexOf(list[index]);
    const swapItem = direction === "up" ? list[index - 1] : list[index + 1];
    if (!swapItem) return;
    const swapIdx = categories.indexOf(swapItem);

    const reordered = [...categories];
    const temp = reordered[sourceIdx];
    reordered[sourceIdx] = reordered[swapIdx];
    reordered[swapIdx] = temp;

    const updated = reordered.map((c, i) => ({ ...c, sort_order: i + 1 }));
    setCategories(updated);

    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updated.map((c) => ({ id: c.id, sort_order: c.sort_order })),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to reorder");
        fetchCategories();
      }
    } catch {
      toast.error("Failed to reorder");
      fetchCategories();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">
            Category Management
          </p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Categories</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
        <Input
          placeholder="Search categories..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-4 py-3 w-20">Image</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3 text-center">Sort</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-ivory-dark/40">
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 bg-ivory-dark rounded-lg animate-pulse" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-4 w-32 bg-ivory-dark rounded-lg animate-pulse" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-4 w-24 bg-ivory-dark rounded-lg animate-pulse" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-4 w-8 bg-ivory-dark rounded-lg animate-pulse mx-auto" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-5 w-14 bg-ivory-dark rounded-full animate-pulse" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-4 w-16 bg-ivory-dark rounded-lg animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <FolderOpen className="mx-auto mb-3 h-10 w-10 text-charcoal-muted/30" />
                    <p className="text-sm font-medium text-charcoal-muted">No categories found</p>
                    <p className="text-xs text-charcoal-muted mt-1">
                      {searchInput ? "Try a different search term" : "Add your first category to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((category, index) => (
                  <tr
                    key={category.id}
                    className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 bg-ivory-dark rounded-lg overflow-hidden flex-shrink-0">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FolderOpen className="h-5 w-5 text-charcoal-muted/40 m-auto mt-3.5" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-charcoal truncate max-w-[200px]">
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="text-xs text-charcoal-muted truncate max-w-[200px]">
                          {category.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-charcoal-muted text-xs font-mono">
                      {category.slug}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => moveCategory(index, "up")}
                          disabled={index === 0}
                          className={cn(
                            "p-1 rounded transition-colors",
                            index === 0
                              ? "text-charcoal-muted/30 cursor-not-allowed"
                              : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark"
                          )}
                          title="Move up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-mono text-charcoal-muted w-6 text-center">
                          {category.sort_order}
                        </span>
                        <button
                          onClick={() => moveCategory(index, "down")}
                          disabled={index === filtered.length - 1}
                          className={cn(
                            "p-1 rounded transition-colors",
                            index === filtered.length - 1
                              ? "text-charcoal-muted/30 cursor-not-allowed"
                              : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark"
                          )}
                          title="Move down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={category.is_active ? "success" : "default"}
                        className="text-[10px] font-semibold uppercase"
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => toggleActive(category)}
                          className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors rounded"
                          title={category.is_active ? "Deactivate" : "Activate"}
                        >
                          <span className={cn(
                            "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
                            category.is_active
                              ? "text-green-700 bg-green-50"
                              : "text-charcoal-muted bg-ivory-dark"
                          )}>
                            {category.is_active ? "ON" : "OFF"}
                          </span>
                        </button>
                        <button
                          onClick={() => openEdit(category)}
                          className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors rounded"
                          title="Edit category"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 text-charcoal-muted hover:bg-rose-50 hover:text-rose-500 transition-colors rounded"
                          title="Delete category"
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                name: e.target.value,
                slug:
                  prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                    ? e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                    : prev.slug,
              }))
            }
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, slug: e.target.value }))
            }
            placeholder="auto-generated-from-name"
          />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full border border-ivory-dark/60 rounded-lg px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal"
            />
          </div>
          <MultiImageUpload
            label="Category Image"
            value={form.image ? [form.image] : []}
            onChange={(urls) =>
              setForm((prev) => ({ ...prev, image: urls[0] || "" }))
            }
            folder="categories"
            maxImages={1}
          />
          <Input
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, sort_order: e.target.value }))
            }
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              className="rounded border-ivory-dark accent-charcoal"
            />
            <span className="text-sm font-medium text-charcoal">
              Active
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-ivory-dark/60 pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {editingCategory ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
