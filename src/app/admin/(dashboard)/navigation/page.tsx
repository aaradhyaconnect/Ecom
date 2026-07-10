"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Navigation, Plus, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";

interface NavLink {
  id: string;
  label: string;
  href: string;
  position: string;
  sort_order: number;
  is_active: boolean;
}

interface NavForm {
  label: string;
  href: string;
  position: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm: NavForm = {
  label: "",
  href: "",
  position: "header",
  sort_order: "0",
  is_active: true,
};

const positionOptions = [
  { value: "header", label: "Header" },
  { value: "footer_shop", label: "Footer - Shop" },
  { value: "footer_customer", label: "Footer - Customer" },
  { value: "footer_help", label: "Footer - Help" },
  { value: "footer_company", label: "Footer - Company" },
];

const positionLabels: Record<string, string> = {
  header: "Header",
  footer_shop: "Footer - Shop",
  footer_customer: "Footer - Customer",
  footer_help: "Footer - Help",
  footer_company: "Footer - Company",
};

const positionOrder = ["header", "footer_shop", "footer_customer", "footer_help", "footer_company"];

export default function AdminNavigationPage() {
  const [links, setLinks] = useState<NavLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  const [form, setForm] = useState<NavForm>(emptyForm);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/navigation");
      const data = await res.json();
      if (data.success) setLinks(data.data);
    } catch {
      toast.error("Failed to load navigation links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLinks();
  }, []);

  const openAdd = (position?: string) => {
    setEditingLink(null);
    setForm({ ...emptyForm, position: position || "header" });
    setShowModal(true);
  };

  const openEdit = (link: NavLink) => {
    setEditingLink(link);
    setForm({
      label: link.label,
      href: link.href,
      position: link.position,
      sort_order: String(link.sort_order),
      is_active: link.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label || !form.href) {
      toast.error("Label and href are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label,
        href: form.href,
        position: form.position,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
        ...(editingLink ? { id: editingLink.id } : {}),
      };

      const res = await fetch(
        editingLink
          ? `/api/admin/navigation/${editingLink.id}`
          : "/api/admin/navigation",
        {
          method: editingLink ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success(editingLink ? "Link updated" : "Link created");
        setShowModal(false);
        fetchLinks();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (link: NavLink) => {
    if (!window.confirm(`Delete link "${link.label}"?`)) return;

    try {
      const res = await fetch(`/api/admin/navigation/${link.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Link deleted");
        fetchLinks();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (link: NavLink) => {
    try {
      const res = await fetch(`/api/admin/navigation/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !link.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Link ${link.is_active ? "deactivated" : "activated"}`);
        fetchLinks();
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const groupedLinks = positionOrder
    .map((pos) => ({
      position: pos,
      label: positionLabels[pos],
      items: links
        .filter((l) => l.position === pos)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Navigation Management</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Navigation Links</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Manage header and footer navigation links</p>
        </div>
        <Button onClick={() => openAdd()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </div>

      {loading ? (
        <div className="bg-white border border-ivory-dark/60 rounded-xl p-12 text-center text-charcoal-muted">
          Loading...
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white border border-ivory-dark/60 rounded-xl p-12 text-center text-charcoal-muted">
          <Navigation className="mx-auto mb-2 h-8 w-8" />
          No navigation links found
        </div>
      ) : (
        <div className="space-y-4">
          {groupedLinks.map((group) => (
            <div key={group.position} className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-ivory-dark/20 border-b border-ivory-dark/60">
                <h3 className="text-sm font-semibold text-charcoal">{group.label}</h3>
                <Button variant="ghost" size="sm" onClick={() => openAdd(group.position)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted border-b border-ivory-dark/40">
                      <th className="px-5 py-2">Label</th>
                      <th className="px-5 py-2">Href</th>
                      <th className="px-5 py-2">Order</th>
                      <th className="px-5 py-2">Active</th>
                      <th className="px-5 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((link) => (
                      <tr key={link.id} className="border-b border-ivory-dark/30 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                        <td className="px-5 py-2.5 font-medium">{link.label}</td>
                        <td className="px-5 py-2.5">
                          <span className="font-mono text-xs text-charcoal-muted">{link.href}</span>
                        </td>
                        <td className="px-5 py-2.5 font-mono text-xs text-charcoal-muted">
                          {link.sort_order}
                        </td>
                        <td className="px-5 py-2.5">
                          <button
                            onClick={() => toggleActive(link)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              link.is_active ? "bg-green-500" : "bg-ivory-dark/60"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-ivory transition-transform ${
                                link.is_active ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openEdit(link)}
                              className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(link)}
                              className="p-2 text-charcoal-muted hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingLink ? "Edit Link" : "Add Link"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Shop"
            required
          />
          <Input
            label="Href"
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            placeholder="/collections/all"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Position"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              options={positionOptions}
            />
            <Input
              label="Sort Order"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="border-ivory-dark accent-charcoal"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-ivory-dark/60 pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {editingLink ? "Update Link" : "Create Link"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
