"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { HelpCircle, Plus, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

interface FAQForm {
  question: string;
  answer: string;
  category: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm: FAQForm = {
  question: "",
  answer: "",
  category: "general",
  sort_order: "0",
  is_active: true,
};

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "payment", label: "Payment" },
  { value: "shipping", label: "Shipping" },
  { value: "returns", label: "Returns" },
  { value: "orders", label: "Orders" },
  { value: "products", label: "Products" },
];

const categoryLabels: Record<string, string> = {
  general: "General",
  payment: "Payment",
  shipping: "Shipping",
  returns: "Returns",
  orders: "Orders",
  products: "Products",
};

export default function AdminFAQPage() {
  const { hasPerm } = useAdminPermissions();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [form, setForm] = useState<FAQForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/faq");
      const data = await res.json();
      if (data.success) setFaqs(data.data);
    } catch {
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFAQs();
  }, []);

  const openAdd = () => {
    setEditingFAQ(null);
    setForm({ ...emptyForm, sort_order: String(faqs.length + 1) });
    setShowModal(true);
  };

  const openEdit = (faq: FAQItem) => {
    setEditingFAQ(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: String(faq.sort_order),
      is_active: faq.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.question || !form.answer) {
      toast.error("Question and answer are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        question: form.question,
        answer: form.answer,
        category: form.category,
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
        ...(editingFAQ ? { id: editingFAQ.id } : {}),
      };

      const res = await fetch(
        editingFAQ ? `/api/admin/faq/${editingFAQ.id}` : "/api/admin/faq",
        {
          method: editingFAQ ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success(editingFAQ ? "FAQ updated" : "FAQ created");
        setShowModal(false);
        fetchFAQs();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: FAQItem) => {
    if (!window.confirm(`Delete this FAQ?`)) return;

    try {
      const res = await fetch(`/api/admin/faq/${faq.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("FAQ deleted");
        fetchFAQs();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (faq: FAQItem) => {
    try {
      const res = await fetch(`/api/admin/faq/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !faq.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`FAQ ${faq.is_active ? "deactivated" : "activated"}`);
        fetchFAQs();
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">FAQ Management</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">FAQs</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Manage frequently asked questions</p>
        </div>
        {hasPerm("marketing", "create") && (
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        )}
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3">Question</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Active</th>
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
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-charcoal-muted">
                    <HelpCircle className="mx-auto mb-2 h-8 w-8" />
                    No FAQs found
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                    <td className="px-5 py-3 max-w-xs">
                      <p className="font-medium truncate">{faq.question}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-ivory-dark/60 px-2 py-0.5 rounded-lg">
                        {categoryLabels[faq.category] || faq.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-charcoal-muted">
                      {faq.sort_order}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(faq)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          faq.is_active ? "bg-green-500" : "bg-ivory-dark/60"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-ivory transition-transform ${
                            faq.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {hasPerm("marketing", "edit") && (
                          <button
                            onClick={() => openEdit(faq)}
                            className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {hasPerm("marketing", "delete") && (
                          <button
                            onClick={() => handleDelete(faq)}
                            className="p-2 text-charcoal-muted hover:bg-rose-50 hover:text-rose-600 transition-colors"
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFAQ ? "Edit FAQ" : "Add FAQ"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="How do I track my order?"
            required
          />
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Answer
            </label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              rows={6}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] placeholder:text-charcoal-muted transition-all duration-300"
              placeholder="Provide a detailed answer..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={categoryOptions}
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
            {editingFAQ ? "Update FAQ" : "Create FAQ"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
