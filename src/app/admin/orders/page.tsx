"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Search, ShoppingCart, Eye, X, Truck } from "lucide-react";
import toast from "react-hot-toast";
import type { Order } from "@/types";

const statusOptions = [
  { value: "", label: "All Statuses" },
  ...ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    tracking_id: "",
    courier_name: "",
    estimated_delivery: "",
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

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
          order_status: selectedOrder.order_status,
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
  };

  const statusColor = (status: string) => {
    const s = ORDER_STATUSES.find((o) => o.value === status);
    return s?.color || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500">
          Manage and track customer orders
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8" />
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {order.order_id}
                    </td>
                    <td className="px-4 py-3">
                      {(order as unknown as Record<string, unknown>).profiles ? (
                        <div>
                          <p className="font-medium">
                            {((order as unknown as Record<string, unknown>).profiles as Record<string, unknown>)?.name as string || "N/A"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {((order as unknown as Record<string, unknown>).profiles as Record<string, unknown>)?.email as string || ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.order_status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        disabled={updatingId === order.id}
                        className={`rounded-lg px-2 py-1 text-xs font-medium border-0 cursor-pointer ${statusColor(order.order_status)}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => viewOrder(order)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <p className="text-xs text-gray-500 mb-1">Order Status</p>
                <select
                  value={selectedOrder.order_status}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder.id, e.target.value)
                  }
                  disabled={updatingId === selectedOrder.id}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium border cursor-pointer ${statusColor(selectedOrder.order_status)}`}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment</p>
                <p className="text-sm font-medium capitalize">
                  {selectedOrder.payment_method} ({selectedOrder.payment_status})
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                <p className="text-sm font-medium">
                  {formatPrice(selectedOrder.subtotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-sm font-bold">
                  {formatPrice(selectedOrder.total)}
                </p>
              </div>
              {selectedOrder.coupon_code && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Coupon</p>
                  <p className="text-sm font-medium">
                    {selectedOrder.coupon_code} (-{formatPrice(selectedOrder.discount)})
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="text-sm">{formatDate(selectedOrder.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Shipping Address</p>
                <p className="text-sm">{selectedOrder.shipping_address.full_name}</p>
                <p className="text-sm">{selectedOrder.shipping_address.phone}</p>
                <p className="text-sm">{selectedOrder.shipping_address.street}</p>
                <p className="text-sm">
                  {selectedOrder.shipping_address.city},{" "}
                  {selectedOrder.shipping_address.state} -{" "}
                  {selectedOrder.shipping_address.pincode}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Billing Address</p>
                <p className="text-sm">{selectedOrder.billing_address.full_name}</p>
                <p className="text-sm">{selectedOrder.billing_address.phone}</p>
                <p className="text-sm">{selectedOrder.billing_address.street}</p>
                <p className="text-sm">
                  {selectedOrder.billing_address.city},{" "}
                  {selectedOrder.billing_address.state} -{" "}
                  {selectedOrder.billing_address.pincode}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Items</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.product?.name || "Product"}
                      </p>
                      <p className="text-xs text-gray-500">
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

            <div className="border-t pt-4">
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
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={handleSaveTracking}>
                  Save Tracking
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
