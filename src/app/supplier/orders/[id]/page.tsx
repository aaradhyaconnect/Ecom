"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ArrowLeft, Package, Truck, CheckCircle2, XCircle, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface FulfillmentDetail {
  fulfillment_id: string;
  status: string;
  assigned_at: string;
  tracking_id: string | null;
  courier_name: string | null;
  notes: string | null;
  order: {
    id: string;
    order_id: string;
    total: number;
    items: Array<{ product?: { name: string; price: number }; size: string; color: string; quantity: number; price: number }>;
    shipping_address?: { full_name: string; phone: string; street: string; city: string; state: string; pincode: string };
    order_status: string;
    created_at: string;
  };
}

const statusSteps = [
  { key: "assigned", label: "Assigned", icon: Package },
  { key: "accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "packing", label: "Packing", icon: Package },
  { key: "ready_for_pickup", label: "Ready", icon: Truck },
  { key: "picked_up", label: "Picked Up", icon: Truck },
];

export default function SupplierOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const [detail, setDetail] = useState<FulfillmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ tracking_id: "", courier_name: "" });

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/dashboard");
      const data = await res.json();
      if (data.success) {
        const found = data.data.orders.find((o: { fulfillment_id: string }) => o.fulfillment_id === id);
        if (found) setDetail(found);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    setActionLoading(true);
    try {
      const body: Record<string, string> = { status };
      if (status === "ready_for_pickup" && trackingForm.tracking_id) {
        body.tracking_id = trackingForm.tracking_id;
        body.courier_name = trackingForm.courier_name;
      }
      const res = await fetch(`/api/supplier/fulfillment/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchDetail();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-ivory-dark/40 rounded-lg animate-pulse" />)}</div>;
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal-muted">Order not found</p>
        <Link href="/supplier/dashboard" className="text-sm text-charcoal underline mt-2 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === detail.status);
  const canAccept = ["assigned", "notified"].includes(detail.status);
  const canReject = canAccept;
  const canStartPacking = detail.status === "accepted";
  const canMarkReady = detail.status === "packing";

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/supplier/dashboard")} className="flex items-center gap-1 text-sm text-charcoal-muted hover:text-charcoal">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-light tracking-wider">{detail.order.order_id}</h1>
          <p className="text-xs text-charcoal-muted">Placed {formatDate(detail.order.created_at)}</p>
        </div>
        <Badge variant={
          detail.status === "rejected" ? "error" :
          detail.status === "picked_up" ? "success" :
          "warning"
        }>
          {detail.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusSteps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
              i <= currentStepIndex
                ? "bg-charcoal text-white border-charcoal"
                : "bg-white text-charcoal-muted border-ivory-dark/60"
            }`}>
              <step.icon className="h-3 w-3" />
              {step.label}
            </div>
            {i < statusSteps.length - 1 && <div className={`w-6 h-px ${i < currentStepIndex ? "bg-charcoal" : "bg-ivory-dark/60"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-ivory-dark/40 p-4 rounded-lg">
          <p className="text-xs font-medium text-charcoal-muted mb-2">Order Items</p>
          <div className="space-y-2">
            {detail.order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <p>{item.product?.name || "Product"}</p>
                  <p className="text-xs text-charcoal-muted">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                </div>
                <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-ivory-dark/60 mt-3 pt-3 flex justify-between text-sm font-medium">
            <span>Total</span>
            <span>{formatPrice(detail.order.total)}</span>
          </div>
        </div>

        {detail.order.shipping_address && (
          <div className="bg-ivory-dark/40 p-4 rounded-lg">
            <p className="text-xs font-medium text-charcoal-muted mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Shipping Address
            </p>
            <p className="text-sm">{detail.order.shipping_address.full_name}</p>
            <p className="text-sm">{detail.order.shipping_address.phone}</p>
            <p className="text-sm">{detail.order.shipping_address.street}</p>
            <p className="text-sm">{detail.order.shipping_address.city}, {detail.order.shipping_address.state} - {detail.order.shipping_address.pincode}</p>
          </div>
        )}
      </div>

      {(canAccept || canReject || canStartPacking || canMarkReady) && (
        <div className="border border-ivory-dark/60 rounded-lg p-4 space-y-4">
          <p className="text-xs font-medium text-charcoal-muted">Actions</p>

          {canAccept && (
            <div className="flex gap-2">
              <Button onClick={() => handleStatusUpdate("accepted")} disabled={actionLoading} className="bg-green-700 hover:bg-green-800">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Accept Order
              </Button>
              <Button onClick={() => handleStatusUpdate("rejected")} disabled={actionLoading} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          )}

          {canStartPacking && (
            <Button onClick={() => handleStatusUpdate("packing")} disabled={actionLoading}>
              <Package className="h-4 w-4 mr-1" /> Start Packing
            </Button>
          )}

          {canMarkReady && (
            <div className="space-y-3">
              <Input
                placeholder="Tracking ID (optional)"
                value={trackingForm.tracking_id}
                onChange={(e) => setTrackingForm({ ...trackingForm, tracking_id: e.target.value })}
              />
              <Input
                placeholder="Courier name (optional)"
                value={trackingForm.courier_name}
                onChange={(e) => setTrackingForm({ ...trackingForm, courier_name: e.target.value })}
              />
              <Button onClick={() => handleStatusUpdate("ready_for_pickup")} disabled={actionLoading}>
                <Truck className="h-4 w-4 mr-1" /> Mark Ready for Pickup
              </Button>
            </div>
          )}
        </div>
      )}

      {detail.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          This order has been rejected. The admin will reassign it.
        </div>
      )}
    </div>
  );
}
