"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useDebounce } from "@/hooks/useDebounce";
import { usePolling } from "@/hooks/usePolling";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Search, ShoppingCart, Eye, Truck, ChevronLeft, ChevronRight, MessageSquare, Printer, Clock } from "lucide-react";
import toast from "react-hot-toast";
import type { Order, OrderNote } from "@/types";

const statusOptions = [
  { value: "", label: "All Statuses" },
  ...ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

export default function AdminOrdersPage() {
  const { hasPerm } = useAdminPermissions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    tracking_id: "",
    courier_name: "",
    estimated_delivery: "",
  });
  const [creatingShipment, setCreatingShipment] = useState(false);

  const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [dateFromApplied, setDateFromApplied] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]);
  const [dateToApplied, setDateToApplied] = useState(() => new Date().toISOString().split("T")[0]);

  const [orderNotes, setOrderNotes] = useState<OrderNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteIsInternal, setNoteIsInternal] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [notesCountMap, setNotesCountMap] = useState<Record<string, number>>({});

  const search = useDebounce(searchInput, 300);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchOrders = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (dateFromApplied) params.set("from", dateFromApplied);
      if (dateToApplied) params.set("to", dateToApplied);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotal(data.total);
        if (data.notes_count) {
          setNotesCountMap(data.notes_count);
        }
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, dateFromApplied, dateToApplied]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  usePolling(fetchOrders, 15000, !selectedOrder);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order status updated");
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, order_status: newStatus as Order["order_status"] });
        }
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...trackingForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tracking info updated");
        setSelectedOrder(data.data);
        fetchOrders();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to update tracking");
    }
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setTrackingForm({
      tracking_id: order.tracking_id || "",
      courier_name: order.courier_name || "",
      estimated_delivery: order.estimated_delivery || "",
    });
    setNewNote("");
    setNoteIsInternal(true);
    fetchNotes(order.id);
  };

  const fetchNotes = async (orderId: string) => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes`);
      const data = await res.json();
      if (data.success) {
        setOrderNotes(data.data);
      }
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedOrder || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, is_internal: noteIsInternal }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderNotes((prev) => [...prev, data.data]);
        setNewNote("");
        toast.success("Note added");
        setNotesCountMap((prev) => ({
          ...prev,
          [selectedOrder.id]: (prev[selectedOrder.id] || 0) + 1,
        }));
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSavingNote(false);
    }
  };

  const escapeHtml = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const printInvoice = () => {
    if (!selectedOrder) return;
    const o = selectedOrder;
    const addr = o.shipping_address;
    const itemsHtml = o.items
      .map(
        (item) => `
        <tr>
          <td>${escapeHtml(item.product?.name || "Product")}</td>
          <td>${escapeHtml(item.size)}</td>
          <td>${escapeHtml(item.color)}</td>
          <td style="text-align:right">${item.quantity}</td>
          <td style="text-align:right">${formatPrice(item.product?.price || 0)}</td>
        </tr>`
      )
      .join("");
    const html = `<!DOCTYPE html>
<html><head>
<style>
  body{font-family:Georgia,serif;color:#1a1a1a;padding:40px;max-width:700px;margin:auto}
  h1{font-size:20px;margin:0 0 4px}
  .sub{font-size:12px;color:#666;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th,td{padding:8px 10px;border-bottom:1px solid #ddd;font-size:13px}
  th{text-align:left;background:#f5f5f0;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
  .addr{font-size:13px;line-height:1.6;margin:12px 0}
  .totals{text-align:right;margin-top:20px;font-size:13px}
  .totals .row{display:flex;justify-content:flex-end;gap:24px;padding:4px 0}
  .totals .grand{border-top:2px solid #1a1a1a;font-size:16px;font-weight:700;padding-top:8px;margin-top:4px}
  @media print{body{padding:20px}}
</style></head><body>
  <h1>INVOICE</h1>
  <div class="sub">Order ${o.order_id} &mdash; ${formatDate(o.created_at)}</div>
  <table>
    <thead><tr><th>Item</th><th>Size</th><th>Color</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${formatPrice(o.subtotal)}</span></div>
    <div class="row"><span>Shipping</span><span>${formatPrice(o.shipping_charge)}</span></div>
    ${o.discount ? `<div class="row"><span>Discount</span><span>-${formatPrice(o.discount)}</span></div>` : ""}
    <div class="row grand"><span>Total</span><span>${formatPrice(o.total)}</span></div>
  </div>
  <div class="addr">
    <strong>Ship to:</strong><br/>
    ${escapeHtml(addr.full_name)}<br/>
    ${escapeHtml(addr.street)}<br/>
    ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} - ${escapeHtml(addr.pincode)}<br/>
    Phone: ${escapeHtml(addr.phone)}
  </div>
  <p style="font-size:12px;color:#666;margin-top:24px">Payment: ${escapeHtml(o.payment_method)} (${escapeHtml(o.payment_status)})</p>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  const statusColor = (status: string) => {
    const s = ORDER_STATUSES.find((o) => o.value === status);
    return s?.color || "text-charcoal-muted bg-ivory-dark/50";
  };

  const handleCreateShipment = async () => {
    if (!selectedOrder) return;
    setCreatingShipment(true);
    try {
      const res = await fetch("/api/shipping/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: selectedOrder.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Shipment created successfully");
        setSelectedOrder(data.data);
        setTrackingForm({
          tracking_id: data.data.tracking_id || "",
          courier_name: data.data.courier_name || "",
          estimated_delivery: data.data.estimated_delivery || "",
        });
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to create shipment");
      }
    } catch {
      toast.error("Failed to create shipment");
    } finally {
      setCreatingShipment(false);
    }
  };

  const exportOrders = () => {
    const headers = ["Order ID", "Customer", "Status", "Payment", "Total", "Date"];
    const rows = orders.map((o) => [
      o.order_id,
      (o as unknown as Record<string, Record<string, string>>).profiles?.name || "N/A",
      o.order_status,
      o.payment_status,
      String(o.total),
      formatDate(o.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Orders exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Order Management</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Orders</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Manage and track customer orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportOrders}>
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
          <Input
            placeholder="Search by order ID or customer..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={statusOptions}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-ivory-dark/60 rounded-lg text-sm bg-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-ivory-dark/60 rounded-lg text-sm bg-white"
          />
        </div>
        <Button
          size="sm"
          onClick={() => { setDateFromApplied(dateFrom); setDateToApplied(dateTo); setPage(1); }}
        >
          Apply
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const df = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
            const dt = new Date().toISOString().split("T")[0];
            setDateFrom(df);
            setDateTo(dt);
            setDateFromApplied(df);
            setDateToApplied(dt);
            setPage(1);
          }}
        >
          Clear
        </Button>
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8" />
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{order.order_id}</span>
                        {order.is_prebook && <Badge variant="warning"><Clock className="h-3 w-3 inline mr-1" />Pre-Book</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {(order as unknown as Record<string, unknown>).profiles ? (
                        <div>
                          <p className="font-medium">
                            {((order as unknown as Record<string, unknown>).profiles as Record<string, unknown>)?.name as string || "N/A"}
                          </p>
                          <p className="text-xs text-charcoal-muted">
                            {((order as unknown as Record<string, unknown>).profiles as Record<string, unknown>)?.email as string || ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-charcoal-muted">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {hasPerm("orders", "edit") ? (
                        <select
                          value={order.order_status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          disabled={updatingId === order.id}
                          className={`px-2 py-1 text-xs font-medium border-0 cursor-pointer ${statusColor(order.order_status)}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge
                          variant={
                            order.order_status === "delivered"
                              ? "success"
                              : order.order_status === "cancelled"
                              ? "error"
                              : "default"
                          }
                        >
                          {ORDER_STATUSES.find((s) => s.value === order.order_status)?.label || order.order_status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          order.payment_status === "paid"
                            ? "success"
                            : order.payment_status === "failed"
                            ? "error"
                            : "warning"
                        }
                      >
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3 text-xs text-charcoal-muted">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {notesCountMap[order.id] > 0 && (
                          <span className="relative inline-flex items-center text-gold-dark" title={`${notesCountMap[order.id]} note(s)`}>
                            <MessageSquare className="h-4 w-4" />
                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-3.5 h-3.5 text-[9px] font-bold text-white bg-gold-dark rounded-full leading-none">
                              {notesCountMap[order.id]}
                            </span>
                          </span>
                        )}
                        <button
                          onClick={() => viewOrder(order)}
                          className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
                        >
                          <Eye className="h-4 w-4" />
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
            Page {page} of {totalPages} ({total} orders)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.order_id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-charcoal-muted mb-1">Order Status</p>
                {hasPerm("orders", "edit") ? (
                  <select
                    value={selectedOrder.order_status}
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value)
                    }
                    disabled={updatingId === selectedOrder.id}
                    className={`px-3 py-1.5 text-sm font-medium border cursor-pointer ${statusColor(selectedOrder.order_status)}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge
                    variant={
                      selectedOrder.order_status === "delivered"
                        ? "success"
                        : selectedOrder.order_status === "cancelled"
                        ? "error"
                        : "default"
                    }
                  >
                    {ORDER_STATUSES.find((s) => s.value === selectedOrder.order_status)?.label || selectedOrder.order_status}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-charcoal-muted mb-1">Payment</p>
                <p className="text-sm font-medium capitalize">
                  {selectedOrder.payment_method} ({selectedOrder.payment_status})
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal-muted mb-1">Subtotal</p>
                <p className="text-sm font-medium">
                  {formatPrice(selectedOrder.subtotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal-muted mb-1">Total</p>
                <p className="text-sm font-bold">
                  {formatPrice(selectedOrder.total)}
                </p>
              </div>
              {selectedOrder.coupon_code && (
                <div>
                  <p className="text-xs text-charcoal-muted mb-1">Coupon</p>
                  <p className="text-sm font-medium">
                    {selectedOrder.coupon_code} (-{formatPrice(selectedOrder.discount)})
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-charcoal-muted mb-1">Date</p>
                <p className="text-sm">{formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            {selectedOrder.is_prebook && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Pre-Book Order</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-amber-600 mb-1">Deposit Paid</p>
                    <p className="font-semibold text-amber-800">{formatPrice(selectedOrder.prebook_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-600 mb-1">Balance Due</p>
                    <p className="font-semibold text-amber-800">{formatPrice(selectedOrder.balance_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-600 mb-1">Pre-Book Status</p>
                    <select
                      value={selectedOrder.prebook_status || "confirmed"}
                      onChange={async (e) => {
                        try {
                          const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ prebook_status: e.target.value }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setSelectedOrder({ ...selectedOrder, prebook_status: e.target.value as typeof selectedOrder.prebook_status });
                            toast.success("Pre-book status updated");
                            fetchOrders();
                          } else {
                            toast.error(data.error);
                          }
                        } catch {
                          toast.error("Failed to update");
                        }
                      }}
                      className="px-2 py-1 text-xs font-medium border border-amber-300 rounded bg-white text-amber-800"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="ready_to_ship">Ready to Ship</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="balance_collected">Balance Collected</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ivory-dark/40 p-3 rounded-lg">
                <p className="text-xs font-medium text-charcoal-muted mb-1">Shipping Address</p>
                <p className="text-sm">{selectedOrder.shipping_address?.full_name || "—"}</p>
                <p className="text-sm">{selectedOrder.shipping_address?.phone || "—"}</p>
                <p className="text-sm">{selectedOrder.shipping_address?.street || "—"}</p>
                <p className="text-sm">
                  {selectedOrder.shipping_address?.city || "—"},{" "}
                  {selectedOrder.shipping_address?.state || "—"} -{" "}
                  {selectedOrder.shipping_address?.pincode || "—"}
                </p>
              </div>
              <div className="bg-ivory-dark/40 p-3 rounded-lg">
                <p className="text-xs font-medium text-charcoal-muted mb-1">Billing Address</p>
                <p className="text-sm">{selectedOrder.billing_address?.full_name || "—"}</p>
                <p className="text-sm">{selectedOrder.billing_address?.phone || "—"}</p>
                <p className="text-sm">{selectedOrder.billing_address?.street || "—"}</p>
                <p className="text-sm">
                  {selectedOrder.billing_address?.city || "—"},{" "}
                  {selectedOrder.billing_address?.state || "—"} -{" "}
                  {selectedOrder.billing_address?.pincode || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-charcoal-muted mb-2">Items</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-ivory-dark/40 p-3 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.product?.name || "Product"}
                      </p>
                      <p className="text-xs text-charcoal-muted">
                        Size: {item.size} | Color: {item.color} | Qty:{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.product?.price || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-ivory-dark/60 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4" />
                <span className="text-sm font-medium">Tracking Info</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="Tracking ID"
                  value={trackingForm.tracking_id}
                  onChange={(e) =>
                    setTrackingForm({
                      ...trackingForm,
                      tracking_id: e.target.value,
                    })
                  }
                />
                <Input
                  placeholder="Courier Name"
                  value={trackingForm.courier_name}
                  onChange={(e) =>
                    setTrackingForm({
                      ...trackingForm,
                      courier_name: e.target.value,
                    })
                  }
                />
                <Input
                  type="date"
                  value={trackingForm.estimated_delivery}
                  onChange={(e) =>
                    setTrackingForm({
                      ...trackingForm,
                      estimated_delivery: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {hasPerm("orders", "edit") && !selectedOrder.shiprocket_shipment_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={creatingShipment}
                    onClick={handleCreateShipment}
                  >
                    Create Shipment via Shiprocket
                  </Button>
                )}
                {hasPerm("orders", "edit") && (
                  <Button size="sm" onClick={handleSaveTracking}>
                    Save Tracking
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t border-ivory-dark/60 pt-4">
              <button
                onClick={printInvoice}
                className="flex items-center gap-2 text-sm text-charcoal hover:text-gold-dark transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </button>
            </div>

            <div className="border-t border-ivory-dark/60 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Order Notes</span>
              </div>

              {notesLoading ? (
                <p className="text-xs text-charcoal-muted">Loading notes...</p>
              ) : orderNotes.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {orderNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg text-sm border ${
                        note.is_internal
                          ? "bg-amber-50 border-amber-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-medium text-charcoal-muted">
                          {note.is_internal ? "Internal" : "Customer visible"}
                        </span>
                        <span className="text-[10px] text-charcoal-muted">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="text-charcoal">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-charcoal-muted mb-4">No notes yet.</p>
              )}

              <div className="space-y-2">
                {hasPerm("orders", "edit") && (
                  <>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      rows={3}
                      className="w-full px-3 py-2 border border-ivory-dark/60 rounded-lg text-sm bg-white resize-none focus:border-gold/60 focus:ring-0"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-gray-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noteIsInternal}
                          onChange={(e) => setNoteIsInternal(e.target.checked)}
                          className="rounded border-ivory-dark/60"
                        />
                        Internal note
                      </label>
                      <Button
                        size="sm"
                        isLoading={savingNote}
                        disabled={!newNote.trim()}
                        onClick={handleAddNote}
                      >
                        Add Note
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
