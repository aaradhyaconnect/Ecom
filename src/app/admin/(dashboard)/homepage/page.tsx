"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Layout, ArrowUp, ArrowDown, Eye, EyeOff, Edit } from "lucide-react";
import toast from "react-hot-toast";

interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  config: Record<string, unknown>;
}

export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", description: "" });

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/homepage");
      const data = await res.json();
      if (data.success) setSections(data.data);
    } catch {
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSections();
  }, []);

  const openEdit = (section: HomepageSection) => {
    setEditingSection(section);
    setForm({
      title: section.title || "",
      subtitle: section.subtitle || "",
      description: section.description || "",
    });
    setShowModal(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Homepage sections updated");
        setShowModal(false);
        fetchSections();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = (index: number) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], is_active: !updated[index].is_active };
    setSections(updated);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSections(reordered);
  };

  const updateEditingField = (field: string, value: string) => {
    if (!editingSection) return;
    const updated = sections.map((s) =>
      s.id === editingSection.id ? { ...s, [field]: value } : s
    );
    setSections(updated);
    setEditingSection({ ...editingSection, [field]: value });
    setForm({ ...form, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Homepage Management</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Homepage Sections</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Configure homepage content sections</p>
        </div>
        <Button onClick={handleSaveAll} isLoading={saving}>
          Save Changes
        </Button>
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3 w-12">#</th>
                <th className="px-5 py-3">Section</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Subtitle</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-charcoal-muted">
                    Loading...
                  </td>
                </tr>
              ) : sections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-charcoal-muted">
                    <Layout className="mx-auto mb-2 h-8 w-8" />
                    No sections found
                  </td>
                </tr>
              ) : (
                sections.map((section, index) => (
                  <tr key={section.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => moveSection(index, "up")}
                          disabled={index === 0}
                          className="p-0.5 text-charcoal-muted hover:text-charcoal disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-mono text-charcoal-muted">{section.sort_order}</span>
                        <button
                          onClick={() => moveSection(index, "down")}
                          disabled={index === sections.length - 1}
                          className="p-0.5 text-charcoal-muted hover:text-charcoal disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-charcoal-muted">
                        {section.section_key}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{section.title || "-"}</td>
                    <td className="px-5 py-3 text-xs text-charcoal-muted truncate max-w-[200px]">
                      {section.subtitle || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(index)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          section.is_active ? "bg-green-500" : "bg-ivory-dark/60"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-ivory transition-transform ${
                            section.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {section.is_active ? (
                          <Eye className="h-4 w-4 text-charcoal-muted" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-charcoal-muted" />
                        )}
                        <button
                          onClick={() => openEdit(section)}
                          className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
                        >
                          <Edit className="h-4 w-4" />
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
        title={`Edit Section: ${editingSection?.section_key || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => updateEditingField("title", e.target.value)}
          />
          <Input
            label="Subtitle"
            value={form.subtitle}
            onChange={(e) => updateEditingField("subtitle", e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateEditingField("description", e.target.value)}
              rows={6}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] placeholder:text-charcoal-muted transition-all duration-300"
              placeholder="Section description or content..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-ivory-dark/60 pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button onClick={handleSaveAll} isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
