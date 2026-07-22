"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Package, Clock, CheckCircle2, XCircle, Truck, ExternalLink } from "lucide-react";

interface FulfillmentOrder {
  fulfillment_id: string;
  status: string;
  assigned_at: string;
  order: {
    id: string;
    order_id: string;
    total: number;
    items: Array<{ product?: { name: string }; size: string; color: string; quantity: number }>;
    shipping_address?: { full_name: string; city: string; state: string; pincode: string };
    order_status: string;
    created_at: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  packing: number;
  ready: number;
  picked_up: number;
  rejected: number;
}

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "error" | "default"; icon: React.ReactNode }> = {
  assigned: { label: "New Assignment", variant: "warning", icon: <Package className="h-3 w-3" /> },
  notified: { label: "Awaiting Response", variant: "warning", icon: <Clock className="h-3 w-3" /> },
  accepted: { label: "Accepted", variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "error", icon: <XCircle className="h-3 w-3" /> },
  packing: { label: "Packing", variant: "default", icon: <Package className="h-3 w-3" /> },
  ready_for_pickup: { label: "Ready for Pickup", variant: "success", icon: <Truck className="h-3 w-3" /> },
  picked_up: { label: "Picked Up", variant: "success", icon: <Truck className="h-3 w-3" /> },
};

export default function SupplierDashboardPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/dashboard");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders);
        setStats(data.data.stats);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-ivory-dark/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-light tracking-wider">DASHBOARD</h1>
        <p className="text-sm text-charcoal-muted">Manage your assigned orders</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pending", value: stats.pending, color: "text-amber-600" },
            { label: "Accepted", value: stats.accepted, color: "text-green-600" },
            { label: "Ready", value: stats.ready, color: "text-blue-600" },
            { label: "Completed", value: stats.picked_up, color: "text-charcoal" },
          ].map((s) => (
            <div key={s.label} className="bg-ivory-dark/40 p-3 rounded-lg text-center">
              <p className={`text-2xl font-light ${s.color}`}>{s.value}</p>
              <p className="text-xs text-charcoal-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {["all", "assigned", "accepted", "packing", "ready_for_pickup", "picked_up", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              filter === f
                ? "bg-charcoal text-white border-charcoal"
                : "bg-white text-charcoal-muted border-ivory-dark/60 hover:border-charcoal/30"
            }`}
          >
            {f === "all" ? "All" : statusConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-charcoal-muted">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fo) => {
            const config = statusConfig[fo.status] || { label: fo.status, variant: "default" as const, icon: null };
            return (
              <Link
                key={fo.fulfillment_id}
                href={`/supplier/orders/${fo.fulfillment_id}`}
                className="block border border-ivory-dark/60 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{fo.order.order_id}</p>
                    <p className="text-xs text-charcoal-muted">
                      {formatDate(fo.order.created_at)}
                    </p>
                  </div>
                  <Badge variant={config.variant}>
                    {config.icon}
                    <span className="ml-1">{config.label}</span>
                  </Badge>
                </div>
                <div className="text-xs text-charcoal-muted space-y-0.5">
                  <p>
                    {fo.order.items.length} item(s) — {fo.order.items.map((i) => `${i.product?.name || "Product"} (${i.size})`).join(", ")}
                  </p>
                  {fo.order.shipping_address && (
                    <p>
                      Ship to: {fo.order.shipping_address.full_name}, {fo.order.shipping_address.city}, {fo.order.shipping_address.state} - {fo.order.shipping_address.pincode}
                    </p>
                  )}
                  <p className="font-medium text-charcoal">{formatPrice(fo.order.total)}</p>
                </div>
                <div className="flex items-center justify-end mt-2 text-xs text-charcoal-muted">
                  View details <ExternalLink className="h-3 w-3 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
