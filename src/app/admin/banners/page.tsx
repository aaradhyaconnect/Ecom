"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Image, Plus, Pencil, Trash2, GripVertical, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";
import type { Banner } from "@/types";

interface BannerForm {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  order: string;
  is_active: boolean;
}

const emptyForm: BannerForm = {
  title: "",
  subtitle: "",
  image: "",
  link: "",
  order: "0",
  is_active: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      if (data.success) setBanners(data.data);
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAdd = () => {
    setEditingBanner(null);
    setForm({ ...emptyForm, order: String(banners.length + 1) });
    setShowModal(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image: banner.image,
      link: banner.link || "",
      order: String(banner.order),
      is_active: banner.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.image) {
      toast.error("Title and image URL are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        order: Number(form.order),
        ...(editingBanner ? { id: editingBanner.id } : {}),
      };

      const res = await fetch("/api/admin/banners", {
        method: editingBanner ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingBanner ? "Banner updated" : "Banner created");
        setShowModal(false);
        fetchBanners();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/banners?id=${banner.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Banner deleted");
        fetchBanners();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: banner.id,
          is_active: !banner.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Banner ${banner.is_active ? "hidden" : "shown"}`);
        fetchBanners();
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const moveBanner = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((b, i) => ({ ...b, order: i + 1 }));
    setBanners(reordered);

    try {
      await Promise.all(
        reordered.map((b) =>
          fetch("/api/admin/banners", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: b.id, order: b.order }),
          })
        )
      );
    } catch {
      toast.error("Failed to reorder");
      fetchBanners();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-sm text-gray-500">
            Manage homepage banners and promotions
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          Loading...
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-400">
          <Image className="mx-auto mb-2 h-8 w-8" />
          No banners yet
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="rounded-xl border bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-start gap-4 p-4">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => moveBanner(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <span className="text-xs font-mono text-gray-400">{banner.order}</span>
                  <button
                    onClick={() => moveBanner(index, "down")}
                    disabled={index === banners.length - 1}
                    className="p-1 text-gray-400 hover:text-black disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>

                <div className="h-20 w-36 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {banner.image ? (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{banner.title}</h3>
                    {!banner.is_active && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  {banner.subtitle && (
                    <p className="text-sm text-gray-500 truncate">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.link && (
                    <p className="text-xs text-blue-500 truncate mt-1">
                      {banner.link}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(banner)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                    title={banner.is_active ? "Hide" : "Show"}
                  >
                    {banner.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(banner)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBanner ? "Edit Banner" : "Add Banner"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Subtitle"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
          <Input
            label="Image URL"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            required
          />
          {form.image && (
            <div className="h-32 rounded-lg bg-gray-100 overflow-hidden">
              <img
                src={form.image}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <Input
            label="Link URL"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="/collections/summer"
          />
          <Input
            label="Order"
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {editingBanner ? "Update Banner" : "Create Banner"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
