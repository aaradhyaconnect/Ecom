"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { formatDate } from "@/lib/utils/format";
import { FileText, Save, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface PageItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  updated_at: string;
}

interface PageForm {
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
}

const emptyForm: PageForm = {
  title: "",
  content: "",
  meta_title: "",
  meta_description: "",
  is_published: true,
};

export default function AdminPagesPage() {
  const { hasPerm } = useAdminPermissions();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages");
      const data = await res.json();
      if (data.success) setPages(data.data);
    } catch {
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPages();
  }, []);

  const openEdit = (page: PageItem) => {
    setEditingPage(page);
    setForm({
      title: page.title,
      content: page.content,
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      is_published: page.is_published,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${editingPage!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          meta_title: form.meta_title,
          meta_description: form.meta_description,
          is_published: form.is_published,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Page updated");
        setShowModal(false);
        fetchPages();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (page: PageItem) => {
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !page.is_published }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Page ${page.is_published ? "unpublished" : "published"}`);
        fetchPages();
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Content Management</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Pages</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Manage static pages and content</p>
        </div>
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-charcoal-muted">
                    Loading...
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-charcoal-muted">
                    <FileText className="mx-auto mb-2 h-8 w-8" />
                    No pages found
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr
                    key={page.id}
                    onClick={() => openEdit(page)}
                    className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-charcoal-muted">
                        /{page.slug}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{page.title}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-[0.12em] ${
                          page.is_published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {page.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-charcoal-muted">
                      {formatDate(page.updated_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {hasPerm("marketing", "edit") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePublished(page);
                            }}
                            className="p-2 text-charcoal-muted hover:bg-ivory-dark transition-colors"
                            title={page.is_published ? "Unpublish" : "Publish"}
                          >
                            {page.is_published ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Edit Page"
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Content (HTML)
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={16}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal font-mono bg-ivory focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] placeholder:text-charcoal-muted transition-all duration-300"
              placeholder="<h1>Page Title</h1>&#10;<p>Page content goes here...</p>"
            />
          </div>
          <Input
            label="Meta Title"
            value={form.meta_title}
            onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
            placeholder="SEO title"
          />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Meta Description
            </label>
            <textarea
              value={form.meta_description}
              onChange={(e) =>
                setForm({ ...form, meta_description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] placeholder:text-charcoal-muted transition-all duration-300"
              placeholder="SEO description for search engines"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) =>
                setForm({ ...form, is_published: e.target.checked })
              }
              className="border-ivory-dark accent-charcoal"
            />
            <span className="text-sm font-medium">Published</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-ivory-dark/60 pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          {hasPerm("marketing", "edit") && (
            <Button onClick={handleSave} isLoading={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Page
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
