"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { formatPrice, formatDate, formatDateShort } from "@/lib/utils/format";
import {
  Truck,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  CreditCard,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

/* ──────────── Types ──────────── */
interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string;
  pan_number: string;
  bank_name: string;
  bank_account: string;
  ifsc_code: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

interface SupplierDetail extends Supplier {
  products: SupplierProduct[];
  purchase_orders: PurchaseOrder[];
  payments: SupplierPayment[];
  total_paid: number;
  total_purchase_orders: number;
}

interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_sku: string;
  cost_price: number;
  lead_time_days: number;
  min_order_qty: number;
  products: { name: string; slug: string; price: number; stock: number; images: string[] } | null;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  expected_date: string | null;
  received_date: string | null;
  notes: string;
  created_at: string;
  suppliers?: { name: string } | null;
  items?: POItem[];
}

interface POItem {
  id: string;
  po_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  received_qty: number;
  cost_price: number;
  total: number;
  products?: { name: string; images: string[] } | null;
}

interface SupplierPayment {
  id: string;
  supplier_id: string;
  po_id: string | null;
  amount: number;
  payment_method: string;
  reference: string;
  notes: string;
  paid_at: string;
  purchase_orders?: { po_number: string } | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  sku?: string;
}

type Tab = "suppliers" | "orders" | "payments";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-amber-100 text-amber-700",
  partially_received: "bg-orange-100 text-orange-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const EMPTY_SUPPLIER = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gst_number: "",
  pan_number: "",
  bank_name: "",
  bank_account: "",
  ifsc_code: "",
  notes: "",
};

export default function SuppliersPage() {
  const { hasPerm } = useAdminPermissions();
  const canEdit = hasPerm("customers", "edit");

  const [tab, setTab] = useState<Tab>("suppliers");

  /* ── Suppliers state ── */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supTotal, setSupTotal] = useState(0);
  const [supLoading, setSupLoading] = useState(true);
  const [supSearch, setSupSearch] = useState("");
  const [supPage, setSupPage] = useState(1);
  const [supplierModal, setSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<SupplierDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ── PO state ── */
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [poTotal, setPoTotal] = useState(0);
  const [poLoading, setPoLoading] = useState(true);
  const [poSearch, setPoSearch] = useState("");
  const [poPage, setPoPage] = useState(1);
  const [poStatus, setPoStatus] = useState("");
  const [poModal, setPoModal] = useState(false);
  const [poForm, setPoForm] = useState<{
    supplier_id: string;
    expected_date: string;
    notes: string;
    items: Array<{ product_id: string; product_name: string; sku: string; quantity: number; cost_price: number }>;
    tax: number;
  }>({ supplier_id: "", expected_date: "", notes: "", items: [], tax: 0 });
  const [poSuppliers, setPoSuppliers] = useState<Supplier[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [poDetailModal, setPoDetailModal] = useState(false);
  const [poDetail, setPoDetail] = useState<PurchaseOrder | null>(null);
  const [poDetailLoading, setPoDetailLoading] = useState(false);
  const [receiveModal, setReceiveModal] = useState(false);
  const [receiveItems, setReceiveItems] = useState<Array<{ item_id: string; product_name: string; quantity: number; received_qty: number; input: number }>>([]);

  /* ── Payments state ── */
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [payLoading, setPayLoading] = useState(true);
  const [payPage, setPayPage] = useState(1);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ supplier_id: "", po_id: "", amount: "", payment_method: "bank_transfer", reference: "", notes: "" });
  const [paySuppliers, setPaySuppliers] = useState<Supplier[]>([]);
  const [paySupplierPOs, setPaySupplierPOs] = useState<PurchaseOrder[]>([]);

  const LIMIT = 20;

  /* ═══════════════════════════════════════
     FETCHERS
  ═══════════════════════════════════════ */

  const fetchSuppliers = useCallback(async () => {
    setSupLoading(true);
    try {
      const p = new URLSearchParams();
      if (supSearch) p.set("search", supSearch);
      p.set("page", String(supPage));
      p.set("limit", String(LIMIT));
      const res = await fetch(`/api/admin/suppliers?${p}`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
        setSupTotal(data.total);
      }
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setSupLoading(false);
    }
  }, [supSearch, supPage]);

  const fetchPOs = useCallback(async () => {
    setPoLoading(true);
    try {
      const p = new URLSearchParams();
      if (poSearch) p.set("search", poSearch);
      if (poStatus) p.set("status", poStatus);
      p.set("page", String(poPage));
      p.set("limit", String(LIMIT));
      const res = await fetch(`/api/admin/purchase-orders?${p}`);
      const data = await res.json();
      if (data.success) {
        setPos(data.data);
        setPoTotal(data.total);
      }
    } catch {
      toast.error("Failed to load purchase orders");
    } finally {
      setPoLoading(false);
    }
  }, [poSearch, poPage, poStatus]);

  const fetchPayments = useCallback(async () => {
    setPayLoading(true);
    try {
      const p = new URLSearchParams();
      p.set("page", String(payPage));
      p.set("limit", String(LIMIT));
      const res = await fetch(`/api/admin/suppliers?${p}`);
      const supData = await res.json();
      if (supData.success) {
        const allPayRes = await fetch(`/api/admin/suppliers?limit=200`);
        const allSupData = await allPayRes.json();
        if (allSupData.success) {
          const allPayments: SupplierPayment[] = [];
          for (const sup of allSupData.data as Supplier[]) {
            const payRes = await fetch(`/api/admin/suppliers/${sup.id}/payments`);
            const payData = await payRes.json();
            if (payData.success) {
              for (const pay of payData.data) {
                allPayments.push({ ...pay, _supplier_name: sup.name });
              }
            }
          }
          allPayments.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
          const start = (payPage - 1) * LIMIT;
          setPayments(allPayments.slice(start, start + LIMIT));
          setPayTotal(allPayments.length);
        }
      }
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setPayLoading(false);
    }
  }, [payPage]);

  useEffect(() => {
    if (tab === "suppliers") {
      const t = setTimeout(fetchSuppliers, 300);
      return () => clearTimeout(t);
    }
  }, [tab, fetchSuppliers]);

  useEffect(() => {
    if (tab === "orders") {
      const t = setTimeout(fetchPOs, 300);
      return () => clearTimeout(t);
    }
  }, [tab, fetchPOs]);

  useEffect(() => {
    if (tab === "payments") {
      let cancelled = false;
      (async () => {
        try {
          setPayLoading(true);
          const [poRes, payRes] = await Promise.all([
            fetch("/api/admin/purchase-orders"),
            fetch(`/api/admin/suppliers/payments?page=${payPage}&limit=20`),
          ]);
          if (cancelled) return;
          const poJson = await poRes.json();
          const payJson = await payRes.json();
          if (poJson.success && payJson.success) {
            const poList: { id: string; order_number: string; supplier_id: string }[] = poJson.data || [];
            const poMap = new Map(poList.map((po) => [po.id, po]));
            const allPayments = (payJson.data || []).map((p: { purchase_order_id: string; paid_at: string } & Record<string, unknown>) => ({
              ...p,
              po_number: poMap.get(p.purchase_order_id)?.order_number || "—",
              supplier_name: "—",
            }));
            allPayments.sort((a: { paid_at: string }, b: { paid_at: string }) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
            const start = (payPage - 1) * 20;
            setPayments(allPayments.slice(start, start + 20));
            setPayTotal(allPayments.length);
          }
        } catch {
          if (!cancelled) toast.error("Failed to load payments");
        } finally {
          if (!cancelled) setPayLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }
  }, [tab, payPage]);

  /* ═══════════════════════════════════════
     SUPPLIER CRUD
  ═══════════════════════════════════════ */

  const openCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(EMPTY_SUPPLIER);
    setSupplierModal(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      contact_name: s.contact_name,
      email: s.email,
      phone: s.phone,
      address: s.address,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      gst_number: s.gst_number,
      pan_number: s.pan_number,
      bank_name: s.bank_name,
      bank_account: s.bank_account,
      ifsc_code: s.ifsc_code,
      notes: s.notes,
    });
    setSupplierModal(true);
  };

  const saveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editingSupplier
        ? `/api/admin/suppliers/${editingSupplier.id}`
        : "/api/admin/suppliers";
      const method = editingSupplier ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingSupplier ? "Supplier updated" : "Supplier created");
        setSupplierModal(false);
        fetchSuppliers();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const deactivateSupplier = async (s: Supplier) => {
    if (!confirm(`Deactivate supplier "${s.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/suppliers/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Supplier deactivated");
        fetchSuppliers();
      } else {
        toast.error(data.error || "Failed to deactivate");
      }
    } catch {
      toast.error("Failed to deactivate supplier");
    }
  };

  const viewSupplierDetail = async (s: Supplier) => {
    setDetailLoading(true);
    setDetailSupplier(null);
    try {
      const res = await fetch(`/api/admin/suppliers/${s.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailSupplier(data.data);
      } else {
        toast.error("Failed to load supplier details");
      }
    } catch {
      toast.error("Failed to load supplier details");
    } finally {
      setDetailLoading(false);
    }
  };

  /* ═══════════════════════════════════════
     PURCHASE ORDER CRUD
  ═══════════════════════════════════════ */

  const openCreatePO = async () => {
    setPoForm({ supplier_id: "", expected_date: "", notes: "", items: [], tax: 0 });
    try {
      const res = await fetch("/api/admin/suppliers?limit=200");
      const data = await res.json();
      if (data.success) setPoSuppliers(data.data.filter((s: Supplier) => s.is_active));
    } catch { /* empty */ }
    setPoModal(true);
  };

  const searchProducts = async (q: string) => {
    if (q.length < 2) { setProductResults([]); return; }
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      if (data.success) setProductResults(data.data);
    } catch { /* empty */ }
  };

  const addPOItem = (product: Product) => {
    if (poForm.items.some((i) => i.product_id === product.id)) {
      toast.error("Product already added");
      return;
    }
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        { product_id: product.id, product_name: product.name, sku: product.sku || "", quantity: 1, cost_price: 0 },
      ],
    });
    setProductSearch("");
    setProductResults([]);
  };

  const updatePOItem = (idx: number, field: string, value: string | number) => {
    const items = [...poForm.items];
    (items[idx] as Record<string, unknown>)[field] = value;
    setPoForm({ ...poForm, items });
  };

  const removePOItem = (idx: number) => {
    setPoForm({ ...poForm, items: poForm.items.filter((_, i) => i !== idx) });
  };

  const savePO = async () => {
    if (!poForm.supplier_id) { toast.error("Select a supplier"); return; }
    if (poForm.items.length === 0) { toast.error("Add at least one item"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: poForm.supplier_id,
          expected_date: poForm.expected_date || null,
          notes: poForm.notes,
          tax: poForm.tax,
          items: poForm.items,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Purchase order created");
        setPoModal(false);
        fetchPOs();
      } else {
        toast.error(data.error || "Failed to create PO");
      }
    } catch {
      toast.error("Failed to create PO");
    } finally {
      setSaving(false);
    }
  };

  const updatePOStatus = async (poId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`PO marked as ${status.replace("_", " ")}`);
        fetchPOs();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update PO");
    }
  };

  const deletePO = async (poId: string) => {
    if (!confirm("Delete this draft purchase order?")) return;
    try {
      const res = await fetch(`/api/admin/purchase-orders/${poId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("PO deleted");
        fetchPOs();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete PO");
    }
  };

  const viewPODetail = async (po: PurchaseOrder) => {
    setPoDetailLoading(true);
    setPoDetail(null);
    try {
      const res = await fetch(`/api/admin/purchase-orders/${po.id}`);
      const data = await res.json();
      if (data.success) setPoDetail(data.data);
    } catch {
      toast.error("Failed to load PO details");
    } finally {
      setPoDetailLoading(false);
      setPoDetailModal(true);
    }
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    const items = (po.items || []).map((item) => ({
      item_id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      received_qty: item.received_qty,
      input: Math.max(0, item.quantity - item.received_qty),
    }));
    setReceiveItems(items);
    setPoDetail(po);
    setReceiveModal(true);
  };

  const submitReceive = async () => {
    if (!poDetail) return;
    const itemsToSend = receiveItems
      .filter((i) => i.input > 0)
      .map((i) => ({ item_id: i.item_id, received_qty: i.input }));

    if (itemsToSend.length === 0) {
      toast.error("Enter quantities to receive");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/purchase-orders/${poDetail.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToSend }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Stock received — PO ${data.data.status.replace("_", " ")}`);
        setReceiveModal(false);
        fetchPOs();
      } else {
        toast.error(data.error || "Failed to receive");
      }
    } catch {
      toast.error("Failed to receive stock");
    } finally {
      setSaving(false);
    }
  };

  /* ═══════════════════════════════════════
     PAYMENTS
  ═══════════════════════════════════════ */

  const openRecordPayment = async () => {
    setPayForm({ supplier_id: "", po_id: "", amount: "", payment_method: "bank_transfer", reference: "", notes: "" });
    try {
      const res = await fetch("/api/admin/suppliers?limit=200");
      const data = await res.json();
      if (data.success) setPaySuppliers(data.data.filter((s: Supplier) => s.is_active));
    } catch { /* empty */ }
    setPayModal(true);
  };

  const loadSupplierPOs = async (supplierId: string) => {
    try {
      const res = await fetch(`/api/admin/purchase-orders?limit=100`);
      const data = await res.json();
      if (data.success) {
        setPaySupplierPOs(
          data.data.filter((po: PurchaseOrder) => po.supplier_id === supplierId && po.status !== "cancelled")
        );
      }
    } catch { /* empty */ }
  };

  const savePayment = async () => {
    if (!payForm.supplier_id) { toast.error("Select a supplier"); return; }
    if (!payForm.amount || Number(payForm.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/suppliers/${payForm.supplier_id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          po_id: payForm.po_id || null,
          amount: Number(payForm.amount),
          payment_method: payForm.payment_method,
          reference: payForm.reference,
          notes: payForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment recorded");
        setPayModal(false);
        fetchPayments();
      } else {
        toast.error(data.error || "Failed to record payment");
      }
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  /* ═══════════════════════════════════════
     PAGINATION
  ═══════════════════════════════════════ */
  const supTotalPages = Math.ceil(supTotal / LIMIT);
  const poTotalPages = Math.ceil(poTotal / LIMIT);
  const payTotalPages = Math.ceil(payTotal / LIMIT);

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Procurement</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Suppliers &amp; Purchase Orders</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Manage suppliers, POs, and payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-ivory-dark/40 p-1 rounded-xl w-fit">
        {([
          { key: "suppliers", label: "Suppliers", icon: Truck },
          { key: "orders", label: "Purchase Orders", icon: FileText },
          { key: "payments", label: "Payments", icon: CreditCard },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
              tab === key ? "bg-white text-charcoal shadow-sm" : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          TAB 1: SUPPLIERS
      ═══════════════════════════════════════ */}
      {tab === "suppliers" && (
        <>
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
              <Input
                placeholder="Search suppliers..."
                value={supSearch}
                onChange={(e) => { setSupSearch(e.target.value); setSupPage(1); }}
              />
            </div>
            {canEdit && (
              <Button size="sm" onClick={openCreateSupplier}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Supplier
              </Button>
            )}
          </div>

          <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">City</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-charcoal-muted">Loading...</td>
                    </tr>
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-charcoal-muted">
                        <Truck className="mx-auto mb-2 h-8 w-8" />
                        No suppliers found
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors cursor-pointer ${!s.is_active ? "opacity-50" : ""}`}
                        onClick={() => viewSupplierDetail(s)}
                      >
                        <td className="px-5 py-3">
                          <span className="font-medium">{s.name}</span>
                          {s.contact_name && <span className="text-charcoal-muted ml-1 text-xs">({s.contact_name})</span>}
                        </td>
                        <td className="px-5 py-3 text-charcoal-muted">{s.contact_name || "-"}</td>
                        <td className="px-5 py-3 text-charcoal-muted">{s.email || "-"}</td>
                        <td className="px-5 py-3 text-charcoal-muted">{s.phone || "-"}</td>
                        <td className="px-5 py-3 text-charcoal-muted">{s.city || "-"}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <>
                                <button onClick={() => openEditSupplier(s)} className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-charcoal-muted hover:text-charcoal transition-colors" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </button>
                                {s.is_active && (
                                  <button onClick={() => deactivateSupplier(s)} className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-orange-500 hover:text-orange-600 transition-colors" title="Deactivate">
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </>
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

          {supTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-muted">Page {supPage} of {supTotalPages} ({supTotal} suppliers)</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={supPage <= 1} onClick={() => setSupPage(supPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={supPage >= supTotalPages} onClick={() => setSupPage(supPage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════
          TAB 2: PURCHASE ORDERS
      ═══════════════════════════════════════ */}
      {tab === "orders" && (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
                <Input
                  placeholder="Search PO number..."
                  value={poSearch}
                  onChange={(e) => { setPoSearch(e.target.value); setPoPage(1); }}
                />
              </div>
              <select
                value={poStatus}
                onChange={(e) => { setPoStatus(e.target.value); setPoPage(1); }}
                className="px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="confirmed">Confirmed</option>
                <option value="partially_received">Partially Received</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {canEdit && (
              <Button size="sm" onClick={openCreatePO}>
                <Plus className="h-4 w-4 mr-1.5" /> Create PO
              </Button>
            )}
          </div>

          <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                    <th className="px-5 py-3">PO Number</th>
                    <th className="px-5 py-3">Supplier</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Expected</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {poLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-charcoal-muted">Loading...</td>
                    </tr>
                  ) : pos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-charcoal-muted">
                        <FileText className="mx-auto mb-2 h-8 w-8" />
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    pos.map((po) => (
                      <tr
                        key={po.id}
                        className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors cursor-pointer"
                        onClick={() => viewPODetail(po)}
                      >
                        <td className="px-5 py-3 font-medium">{po.po_number}</td>
                        <td className="px-5 py-3 text-charcoal-muted">{po.suppliers?.name || "-"}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[po.status] || "bg-gray-100 text-gray-600"}`}>
                            {po.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium">{formatPrice(po.total)}</td>
                        <td className="px-5 py-3 text-charcoal-muted">{po.expected_date ? formatDateShort(po.expected_date) : "-"}</td>
                        <td className="px-5 py-3 text-charcoal-muted text-xs">{formatDateShort(po.created_at)}</td>
                        <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && po.status === "draft" && (
                              <>
                                <button onClick={() => updatePOStatus(po.id, "sent")} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors" title="Mark as Sent">
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                                <button onClick={() => deletePO(po.id)} className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-rose-500 hover:text-rose-600 transition-colors" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {canEdit && po.status === "sent" && (
                              <button onClick={() => updatePOStatus(po.id, "confirmed")} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 hover:text-green-600 transition-colors" title="Confirm">
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                            {canEdit && (po.status === "confirmed" || po.status === "partially_received") && (
                              <button onClick={() => openReceiveModal(po)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors" title="Receive Stock">
                                <Package className="h-4 w-4" />
                              </button>
                            )}
                            {canEdit && po.status !== "cancelled" && po.status !== "received" && (
                              <button onClick={() => updatePOStatus(po.id, "cancelled")} className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-red-500 hover:text-red-600 transition-colors" title="Cancel">
                                <XCircle className="h-4 w-4" />
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

          {poTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-muted">Page {poPage} of {poTotalPages} ({poTotal} POs)</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={poPage <= 1} onClick={() => setPoPage(poPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={poPage >= poTotalPages} onClick={() => setPoPage(poPage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════
          TAB 3: PAYMENTS
      ═══════════════════════════════════════ */}
      {tab === "payments" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-charcoal-muted">{payTotal} payment(s) total</p>
            {canEdit && (
              <Button size="sm" onClick={openRecordPayment}>
                <Plus className="h-4 w-4 mr-1.5" /> Record Payment
              </Button>
            )}
          </div>

          <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Supplier</th>
                    <th className="px-5 py-3">PO</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-charcoal-muted">Loading...</td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-charcoal-muted">
                        <CreditCard className="mx-auto mb-2 h-8 w-8" />
                        No payments recorded
                      </td>
                    </tr>
                  ) : (
                    payments.map((pay) => (
                      <tr key={pay.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                        <td className="px-5 py-3 text-charcoal-muted text-xs">{formatDateShort(pay.paid_at)}</td>
                        <td className="px-5 py-3 font-medium">{String((pay as unknown as Record<string, unknown>)._supplier_name || "-")}</td>
                        <td className="px-5 py-3 text-charcoal-muted">{pay.purchase_orders?.po_number || "-"}</td>
                        <td className="px-5 py-3 text-charcoal-muted capitalize">{pay.payment_method.replace("_", " ")}</td>
                        <td className="px-5 py-3 text-charcoal-muted">{pay.reference || "-"}</td>
                        <td className="px-5 py-3 font-medium text-right">{formatPrice(pay.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {payTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-charcoal-muted">Page {payPage} of {payTotalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={payPage <= 1} onClick={() => setPayPage(payPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={payPage >= payTotalPages} onClick={() => setPayPage(payPage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════
          MODALS
      ═══════════════════════════════════════ */}

      {/* Supplier Create/Edit Modal */}
      <Modal isOpen={supplierModal} onClose={() => setSupplierModal(false)} title={editingSupplier ? "Edit Supplier" : "Add Supplier"} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Supplier Name *" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
            <Input label="Contact Person" value={supplierForm.contact_name} onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
            <Input label="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          </div>
          <Input label="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" value={supplierForm.city} onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })} />
            <Input label="State" value={supplierForm.state} onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })} />
            <Input label="Pincode" value={supplierForm.pincode} onChange={(e) => setSupplierForm({ ...supplierForm, pincode: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="GST Number" value={supplierForm.gst_number} onChange={(e) => setSupplierForm({ ...supplierForm, gst_number: e.target.value })} />
            <Input label="PAN Number" value={supplierForm.pan_number} onChange={(e) => setSupplierForm({ ...supplierForm, pan_number: e.target.value })} />
          </div>
          <div className="border-t border-ivory-dark pt-4">
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-3">Bank Details</p>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Bank Name" value={supplierForm.bank_name} onChange={(e) => setSupplierForm({ ...supplierForm, bank_name: e.target.value })} />
              <Input label="Account Number" value={supplierForm.bank_account} onChange={(e) => setSupplierForm({ ...supplierForm, bank_account: e.target.value })} />
              <Input label="IFSC Code" value={supplierForm.ifsc_code} onChange={(e) => setSupplierForm({ ...supplierForm, ifsc_code: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Notes</label>
            <textarea
              value={supplierForm.notes}
              onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all resize-none"
              placeholder="Internal notes about this supplier..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={saveSupplier} isLoading={saving}>{editingSupplier ? "Update Supplier" : "Create Supplier"}</Button>
            <Button variant="outline" onClick={() => setSupplierModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Supplier Detail Modal */}
      <Modal isOpen={!!detailSupplier && !supplierModal} onClose={() => setDetailSupplier(null)} title="Supplier Details" size="xl">
        {detailLoading ? (
          <div className="py-12 text-center text-charcoal-muted">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading supplier details...
          </div>
        ) : detailSupplier && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{detailSupplier.name}</h3>
                {detailSupplier.contact_name && <p className="text-sm text-charcoal-muted">{detailSupplier.contact_name}</p>}
                <div className="flex gap-3 text-sm text-charcoal-muted mt-1">
                  {detailSupplier.email && <span>{detailSupplier.email}</span>}
                  {detailSupplier.phone && <span>{detailSupplier.phone}</span>}
                </div>
                {(detailSupplier.city || detailSupplier.state) && (
                  <p className="text-sm text-charcoal-muted mt-0.5">{[detailSupplier.city, detailSupplier.state, detailSupplier.pincode].filter(Boolean).join(", ")}</p>
                )}
              </div>
              <div className="flex gap-4 text-center">
                <div className="bg-ivory-dark/40 p-3 rounded-xl min-w-[100px]">
                  <p className="text-[10px] text-charcoal-muted uppercase">POs</p>
                  <p className="text-xl font-bold">{detailSupplier.purchase_orders.length}</p>
                </div>
                <div className="bg-ivory-dark/40 p-3 rounded-xl min-w-[100px]">
                  <p className="text-[10px] text-charcoal-muted uppercase">Total PO</p>
                  <p className="text-xl font-bold">{formatPrice(detailSupplier.total_purchase_orders)}</p>
                </div>
                <div className="bg-ivory-dark/40 p-3 rounded-xl min-w-[100px]">
                  <p className="text-[10px] text-charcoal-muted uppercase">Paid</p>
                  <p className="text-xl font-bold text-green-600">{formatPrice(detailSupplier.total_paid)}</p>
                </div>
              </div>
            </div>

            {detailSupplier.gst_number && (
              <div className="flex gap-6 text-sm">
                {detailSupplier.gst_number && <span><strong>GST:</strong> {detailSupplier.gst_number}</span>}
                {detailSupplier.pan_number && <span><strong>PAN:</strong> {detailSupplier.pan_number}</span>}
              </div>
            )}

            {detailSupplier.bank_name && (
              <div className="bg-ivory-dark/30 p-4 rounded-xl text-sm">
                <p className="text-[10px] font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Bank Details</p>
                <div className="flex gap-6">
                  <span>{detailSupplier.bank_name}</span>
                  {detailSupplier.bank_account && <span>A/C: {detailSupplier.bank_account}</span>}
                  {detailSupplier.ifsc_code && <span>IFSC: {detailSupplier.ifsc_code}</span>}
                </div>
              </div>
            )}

            {detailSupplier.products.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Products ({detailSupplier.products.length})</p>
                <div className="space-y-2">
                  {detailSupplier.products.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between bg-ivory-dark/40 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{sp.products?.name || "Unknown Product"}</p>
                        <p className="text-xs text-charcoal-muted">SKU: {sp.supplier_sku || "-"} | Lead: {sp.lead_time_days}d | Min Order: {sp.min_order_qty}</p>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(sp.cost_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailSupplier.purchase_orders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Recent Purchase Orders</p>
                <div className="space-y-2">
                  {detailSupplier.purchase_orders.slice(0, 10).map((po) => (
                    <div key={po.id} className="flex items-center justify-between bg-ivory-dark/40 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{po.po_number}</p>
                        <p className="text-xs text-charcoal-muted">{formatDateShort(po.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[po.status] || ""}`}>
                          {po.status.replace("_", " ")}
                        </span>
                        <p className="text-sm font-medium">{formatPrice(po.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailSupplier.payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Recent Payments</p>
                <div className="space-y-2">
                  {detailSupplier.payments.map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between bg-ivory-dark/40 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{pay.purchase_orders?.po_number || "General"}</p>
                        <p className="text-xs text-charcoal-muted">{formatDateShort(pay.paid_at)} | {pay.payment_method.replace("_", " ")}</p>
                      </div>
                      <p className="text-sm font-medium text-green-600">{formatPrice(pay.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailSupplier.notes && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-amber-800">{detailSupplier.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create PO Modal */}
      <Modal isOpen={poModal} onClose={() => setPoModal(false)} title="Create Purchase Order" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Supplier *</label>
              <select
                value={poForm.supplier_id}
                onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all"
              >
                <option value="">Select Supplier</option>
                {poSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Expected Date"
              type="date"
              value={poForm.expected_date}
              onChange={(e) => setPoForm({ ...poForm, expected_date: e.target.value })}
            />
          </div>

          {/* Line Items */}
          <div>
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Line Items</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
              <Input
                placeholder="Search products to add..."
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
              />
              {productResults.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-ivory-dark rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {productResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addPOItem(p)}
                      className="w-full text-left px-4 py-2 hover:bg-ivory-dark/40 text-sm flex items-center justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="text-charcoal-muted text-xs">Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {poForm.items.length > 0 && (
              <div className="space-y-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-charcoal-muted">
                      <th className="text-left pb-2">Product</th>
                      <th className="text-center pb-2 w-20">Qty</th>
                      <th className="text-center pb-2 w-28">Cost Price</th>
                      <th className="text-right pb-2 w-24">Total</th>
                      <th className="pb-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poForm.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-ivory-dark/40">
                        <td className="py-2">
                          <p className="font-medium text-[13px]">{item.product_name}</p>
                          <p className="text-xs text-charcoal-muted">{item.sku || ""}</p>
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updatePOItem(idx, "quantity", parseInt(e.target.value) || 1)}
                            className="w-16 h-7 text-center text-sm border border-ivory-dark rounded-md bg-white"
                          />
                        </td>
                        <td className="py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.cost_price}
                            onChange={(e) => updatePOItem(idx, "cost_price", parseFloat(e.target.value) || 0)}
                            className="w-24 h-7 text-center text-sm border border-ivory-dark rounded-md bg-white"
                          />
                        </td>
                        <td className="py-2 text-right font-medium">{formatPrice(item.quantity * item.cost_price)}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => removePOItem(idx)} className="p-1 text-rose-400 hover:text-rose-600">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end gap-8 text-sm pt-2 border-t border-ivory-dark/40">
                  <span className="text-charcoal-muted">Subtotal:</span>
                  <span className="font-medium">{formatPrice(poForm.items.reduce((s, i) => s + i.quantity * i.cost_price, 0))}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Notes</label>
              <textarea
                value={poForm.notes}
                onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all resize-none"
                placeholder="PO notes..."
              />
            </div>
            <Input
              label="Tax"
              type="number"
              min={0}
              step={0.01}
              value={String(poForm.tax)}
              onChange={(e) => setPoForm({ ...poForm, tax: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-ivory-dark">
            <span className="text-lg font-bold">Total: {formatPrice(poForm.items.reduce((s, i) => s + i.quantity * i.cost_price, 0) + poForm.tax)}</span>
            <div className="flex gap-2">
              <Button onClick={savePO} isLoading={saving}>Create PO</Button>
              <Button variant="outline" onClick={() => setPoModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* PO Detail Modal */}
      <Modal isOpen={poDetailModal} onClose={() => setPoDetailModal(false)} title={`PO ${poDetail?.po_number || ""}`} size="lg">
        {poDetailLoading ? (
          <div className="py-12 text-center text-charcoal-muted">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : poDetail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-charcoal-muted">Supplier: <strong>{poDetail.suppliers?.name || "-"}</strong></p>
                <p className="text-sm text-charcoal-muted">Created: {formatDate(poDetail.created_at)}</p>
                {poDetail.expected_date && <p className="text-sm text-charcoal-muted">Expected: {formatDate(poDetail.expected_date)}</p>}
              </div>
              <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded ${STATUS_COLORS[poDetail.status] || ""}`}>
                {poDetail.status.replace("_", " ")}
              </span>
            </div>

            {poDetail.items && poDetail.items.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-charcoal-muted border-b border-ivory-dark">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-center pb-2">Ordered</th>
                    <th className="text-center pb-2">Received</th>
                    <th className="text-center pb-2">Pending</th>
                    <th className="text-right pb-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {poDetail.items.map((item) => (
                    <tr key={item.id} className="border-b border-ivory-dark/30">
                      <td className="py-2">{item.product_name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-center">{item.received_qty}</td>
                      <td className="py-2 text-center">
                        <span className={item.quantity - item.received_qty > 0 ? "text-amber-600 font-medium" : "text-green-600"}>
                          {Math.max(0, item.quantity - item.received_qty)}
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-between pt-3 border-t border-ivory-dark text-sm">
              <div className="space-y-1">
                <p>Subtotal: <strong>{formatPrice(poDetail.subtotal)}</strong></p>
                <p>Tax: <strong>{formatPrice(poDetail.tax)}</strong></p>
              </div>
              <p className="text-lg font-bold">Total: {formatPrice(poDetail.total)}</p>
            </div>

            {poDetail.notes && (
              <div className="bg-ivory-dark/40 p-3 rounded-xl text-sm">
                <p className="text-xs text-charcoal-muted mb-1">Notes:</p>
                <p>{poDetail.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Receive Stock Modal */}
      <Modal isOpen={receiveModal} onClose={() => setReceiveModal(false)} title="Receive Stock" size="md">
        <div className="space-y-4">
          <p className="text-sm text-charcoal-muted">Enter the quantity received for each item:</p>
          {receiveItems.map((item, idx) => (
            <div key={item.item_id} className="flex items-center justify-between bg-ivory-dark/40 p-3 rounded-lg">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-charcoal-muted">Ordered: {item.quantity} | Already received: {item.received_qty}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal-muted">Receiving:</span>
                <input
                  type="number"
                  min={0}
                  max={item.quantity - item.received_qty}
                  value={item.input}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const max = item.quantity - item.received_qty;
                    setReceiveItems((prev) =>
                      prev.map((ri, i) => (i === idx ? { ...ri, input: Math.min(val, Math.max(0, max)) } : ri))
                    );
                  }}
                  className="w-20 h-8 text-center text-sm font-medium border border-ivory-dark rounded-md bg-white"
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button onClick={submitReceive} isLoading={saving}>Receive Stock</Button>
            <Button variant="outline" onClick={() => setReceiveModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Record Payment" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Supplier *</label>
            <select
              value={payForm.supplier_id}
              onChange={(e) => {
                setPayForm({ ...payForm, supplier_id: e.target.value, po_id: "" });
                loadSupplierPOs(e.target.value);
              }}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all"
            >
              <option value="">Select Supplier</option>
              {paySuppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Purchase Order (optional)</label>
            <select
              value={payForm.po_id}
              onChange={(e) => setPayForm({ ...payForm, po_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all"
              disabled={!payForm.supplier_id}
            >
              <option value="">General Payment</option>
              {paySupplierPOs.map((po) => (
                <option key={po.id} value={po.id}>{po.po_number} — {formatPrice(po.total)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount *"
              type="number"
              min={0}
              step={0.01}
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              placeholder="0.00"
            />
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Payment Method</label>
              <select
                value={payForm.payment_method}
                onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="neft">NEFT</option>
                <option value="rtgs">RTGS</option>
              </select>
            </div>
          </div>

          <Input label="Reference" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Transaction ID, Cheque No, etc." />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Notes</label>
            <textarea
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal bg-ivory focus:border-gold focus:ring-0 transition-all resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={savePayment} isLoading={saving}>Record Payment</Button>
            <Button variant="outline" onClick={() => setPayModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
