"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils/format";
import { Tag, Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Coupon } from "@/types";

interface CouponForm {
  code: string;
  description: string;
  discount_type: "percentage" | "flat";
  discount_value: string;
  min_order: string;
  max_discount: string;
  usage_limit: string;
  expires_at: string;
  is_active: boolean;
}

const emptyForm: CouponForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  min_order: "0",
  max_discount: "",
  usage_limit: "0",
  expires_at: "",
  is_active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) setCoupons(data.data);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCoupons();
  }, []);

  const openAdd = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order: String(coupon.min_order),
      max_discount: coupon.max_discount ? String(coupon.max_discount) : "",
      usage_limit: String(coupon.usage_limit),
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
      is_active: coupon.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast.error("Code and discount value are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        discount_value: Number(form.discount_value),
        min_order: Number(form.min_order),
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: Number(form.usage_limit),
        expires_at: form.expires_at || null,
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
      };

      const res = await fetch("/api/admin/coupons", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCoupon ? "Coupon updated" : "Coupon created");
        setShowModal(false);
        fetchCoupons();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Coupon deleted");
        fetchCoupons();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: coupon.id,
          is_active: !coupon.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${coupon.is_active ? "deactivated" : "activated"}`);
        fetchCoupons();
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-charcoal-muted">
            Create and manage discount coupons
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <div className="border bg-ivory overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ivory-dark/50 text-left text-xs font-medium text-charcoal-muted">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted/60">
                    Loading...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted/60">
                    <Tag className="mx-auto mb-2 h-8 w-8" />
                    No coupons found
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b last:border-0 hover:bg-ivory-dark/50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-sm">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `₹${coupon.discount_value}`}
                      {coupon.max_discount && (
                        <span className="text-xs text-charcoal-muted/60 ml-1">
                          (max ₹{coupon.max_discount})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.used_count}/{coupon.usage_limit || "∞"}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.min_order > 0
                        ? `₹${coupon.min_order}`
                        : "No min"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {coupon.expires_at ? (
                        <span
                          className={
                            isExpired(coupon.expires_at)
                              ? "text-rose-500"
                              : "text-charcoal-muted"
                          }
                        >
                          {formatDate(coupon.expires_at)}
                          {isExpired(coupon.expires_at) && " (Expired)"}
                        </span>
                      ) : (
                        <span className="text-charcoal-muted/60">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          coupon.is_active ? "bg-green-500" : "bg-ivory-dark"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-ivory transition-transform ${
                            coupon.is_active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-2 text-charcoal-muted hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
        title={editingCoupon ? "Edit Coupon" : "Add Coupon"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Coupon Code"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
            placeholder="SUMMER20"
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="20% off on summer collection"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              value={form.discount_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  discount_type: e.target.value as "percentage" | "flat",
                })
              }
              options={[
                { value: "percentage", label: "Percentage (%)" },
                { value: "flat", label: "Flat Amount (₹)" },
              ]}
            />
            <Input
              label="Discount Value"
              type="number"
              value={form.discount_value}
              onChange={(e) =>
                setForm({ ...form, discount_value: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Order (₹)"
              type="number"
              value={form.min_order}
              onChange={(e) => setForm({ ...form, min_order: e.target.value })}
            />
            <Input
              label="Max Discount (₹)"
              type="number"
              value={form.max_discount}
              onChange={(e) =>
                setForm({ ...form, max_discount: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Usage Limit (0 = unlimited)"
              type="number"
              value={form.usage_limit}
              onChange={(e) =>
                setForm({ ...form, usage_limit: e.target.value })
              }
            />
            <Input
              label="Expires At"
              type="date"
              value={form.expires_at}
              onChange={(e) =>
                setForm({ ...form, expires_at: e.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="border-ivory-dark"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {editingCoupon ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
