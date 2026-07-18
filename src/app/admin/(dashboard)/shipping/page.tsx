"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { formatPrice, formatDate } from "@/lib/utils/format";
import {
  Package,
  Truck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Send,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ShipmentSummary {
  total: number;
  pending: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  totalShipments: number;
}

interface RecentShipment {
  id: string;
  order_id: string;
  shipping_address: { full_name: string; city: string; state: string };
  order_status: string;
  tracking_id: string;
  courier_name: string;
  shiprocket_shipment_id: number;
  created_at: string;
  updated_at: string;
  total: number;
}

interface UnshippedOrder {
  id: string;
  order_id: string;
  shipping_address: { full_name: string; city: string; phone: string };
  order_status: string;
  items: { product?: { name?: string; price?: number }; quantity?: number }[];
  total: number;
  created_at: string;
  payment_method: string;
  shiprocket_shipment_id?: number;
}

interface TrackingEvent {
  status: string;
  location: string;
  date: string;
}

interface TrackingData {
  current_status: string;
  current_location: string | null;
  estimated_delivery: string | null;
  tracking_data: TrackingEvent[];
  awb_code: string;
  track_url: string;
}

interface CourierRate {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days: number;
}

type Tab = "dashboard" | "ship" | "track" | "rates";

const statusColor = (status: string) => {
  switch (status) {
    case "pending":
    case "confirmed":
    case "processing":
      return "warning" as const;
    case "packed":
    case "shipped":
    case "out-for-delivery":
      return "new" as const;
    case "delivered":
      return "success" as const;
    case "cancelled":
      return "error" as const;
    case "returned":
      return "default" as const;
    default:
      return "default" as const;
  }
};

export default function ShippingPage() {
  const { hasPerm } = useAdminPermissions();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Dashboard state
  const [summary, setSummary] = useState<ShipmentSummary | null>(null);
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Ship Orders state
  const [unshippedOrders, setUnshippedOrders] = useState<UnshippedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [shipping, setShipping] = useState(false);
  const [shipResults, setShipResults] = useState<{
    order_id: string;
    success: boolean;
    error?: string;
    awb?: string;
  }[] | null>(null);

  // Track state
  const [trackSearch, setTrackSearch] = useState("");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [trackError, setTrackError] = useState("");

  // Rates state
  const [ratePickup, setRatePickup] = useState("");
  const [rateDelivery, setRateDelivery] = useState("");
  const [rateWeight, setRateWeight] = useState("0.5");
  const [rates, setRates] = useState<CourierRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<{
    shipment_id: number;
    order_id: string;
    order_id_display: string;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const res = await fetch("/api/admin/shiprocket");
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setRecentShipments(data.data.recentShipments);
      }
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const fetchUnshippedOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "confirmed");
      params.set("limit", "100");
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      const orders = (data.data || []).filter(
        (o: UnshippedOrder) =>
          !o.shiprocket_shipment_id &&
          ["confirmed", "processing", "pending", "packed"].includes(o.order_status)
      );
      setUnshippedOrders(orders);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDashboard(true);
      try {
        const res = await fetch("/api/admin/shiprocket");
        const data = await res.json();
        if (!cancelled && data.success) {
          setSummary(data.data.summary);
          setRecentShipments(data.data.recentShipments);
        }
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        if (!cancelled) setLoadingDashboard(false);
      }

      setLoadingOrders(true);
      try {
        const params = new URLSearchParams();
        params.set("status", "confirmed");
        params.set("limit", "100");
        const res = await fetch(`/api/admin/orders?${params}`);
        const data = await res.json();
        if (!cancelled) {
          const orders = (data.data || []).filter(
            (o: UnshippedOrder) =>
              !o.shiprocket_shipment_id &&
              ["confirmed", "processing", "pending", "packed"].includes(o.order_status)
          );
          setUnshippedOrders(orders);
        }
      } catch {
        toast.error("Failed to load orders");
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // --- Dashboard ---
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Orders", value: summary?.total ?? 0, icon: Package, color: "text-charcoal" },
          { label: "Pending", value: summary?.pending ?? 0, icon: Clock, color: "text-yellow-600" },
          { label: "In Transit", value: summary?.shipped ?? 0, icon: Truck, color: "text-blue-600" },
          { label: "Delivered", value: summary?.delivered ?? 0, icon: CheckCircle, color: "text-green-600" },
          { label: "Cancelled", value: summary?.cancelled ?? 0, icon: XCircle, color: "text-red-600" },
          { label: "Returned", value: summary?.returned ?? 0, icon: RotateCcw, color: "text-gray-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-ivory-dark/60 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-serif font-bold text-charcoal">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-ivory-dark/60 bg-ivory-dark/20">
          <h3 className="text-[13px] font-semibold text-charcoal">Recent Shipments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">AWB</th>
                <th className="px-5 py-3">Courier</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingDashboard ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted">Loading...</td></tr>
              ) : recentShipments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted">
                  <Truck className="mx-auto mb-2 h-8 w-8" />
                  No shipments yet
                </td></tr>
              ) : (
                recentShipments.map((s) => (
                  <tr key={s.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                    <td className="px-5 py-3 font-medium">{s.order_id}</td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium">{s.shipping_address?.full_name || "—"}</p>
                        <p className="text-xs text-charcoal-muted">{s.shipping_address?.city || ""}, {s.shipping_address?.state || ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{s.tracking_id || "—"}</td>
                    <td className="px-5 py-3 text-xs">{s.courier_name || "—"}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusColor(s.order_status)}>{s.order_status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-charcoal-muted">{formatDate(s.updated_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.tracking_id && (
                          <button
                            onClick={() => { setTrackSearch(String(s.shiprocket_shipment_id || s.tracking_id)); setActiveTab("track"); }}
                            className="p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
                            title="Track"
                          >
                            <Search className="h-4 w-4" />
                          </button>
                        )}
                        {hasPerm("orders", "edit") && s.shiprocket_shipment_id && (
                          <button
                            onClick={() => setCancelTarget({ shipment_id: s.shiprocket_shipment_id, order_id: s.id, order_id_display: s.order_id })}
                            className="p-2 text-charcoal-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Cancel"
                          >
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
    </div>
  );

  // --- Ship Orders ---
  const toggleOrder = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedOrderIds.size === unshippedOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(unshippedOrders.map((o) => o.id)));
    }
  };

  const handleShipSelected = async (ids: string[]) => {
    if (ids.length === 0) return;
    setShipping(true);
    setShipResults(null);
    try {
      const res = await fetch("/api/admin/shiprocket/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: ids }),
      });
      const data = await res.json();
      if (data.success) {
        const successCount = data.data.filter((r: { success: boolean }) => r.success).length;
        const failCount = data.data.length - successCount;
        toast.success(`Shipped ${successCount} order(s)${failCount > 0 ? `, ${failCount} failed` : ""}`);
        setShipResults(data.data);
        setSelectedOrderIds(new Set());
        fetchUnshippedOrders();
        fetchDashboard();
      } else {
        toast.error(data.error || "Failed to ship orders");
      }
    } catch {
      toast.error("Failed to ship orders");
    } finally {
      setShipping(false);
    }
  };

  const renderShipOrders = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-[13px] text-charcoal-muted">
          {unshippedOrders.length} order(s) ready to ship
        </p>
        <div className="flex gap-2">
          {hasPerm("orders", "edit") && (
            <>
              <Button
                size="sm"
                disabled={selectedOrderIds.size === 0 || shipping}
                isLoading={shipping && selectedOrderIds.size > 0}
                onClick={() => handleShipSelected(Array.from(selectedOrderIds))}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Ship Selected ({selectedOrderIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={unshippedOrders.length === 0 || shipping}
                isLoading={shipping && selectedOrderIds.size === 0}
                onClick={() => handleShipSelected(unshippedOrders.map((o) => o.id))}
              >
                Ship All Pending
              </Button>
            </>
          )}
        </div>
      </div>

      {shipResults && (
        <div className="bg-white border border-ivory-dark/60 rounded-xl p-4 shadow-sm">
          <h4 className="text-[13px] font-semibold text-charcoal mb-3">Shipping Results</h4>
          <div className="space-y-2">
            {shipResults.map((r) => (
              <div key={r.order_id} className="flex items-center gap-3 text-sm">
                {r.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <span className="font-medium">{r.order_id}</span>
                {r.success ? (
                  <span className="text-green-700">AWB: {r.awb}</span>
                ) : (
                  <span className="text-red-600">{r.error}</span>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setShipResults(null)} className="mt-3 text-xs text-charcoal-muted hover:text-charcoal">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.size === unshippedOrders.length && unshippedOrders.length > 0}
                    onChange={toggleAll}
                    className="rounded border-ivory-dark/60"
                  />
                </th>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-charcoal-muted">Loading...</td></tr>
              ) : unshippedOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-charcoal-muted">
                  <Package className="mx-auto mb-2 h-8 w-8" />
                  All orders have been shipped
                </td></tr>
              ) : (
                unshippedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        className="rounded border-ivory-dark/60"
                      />
                    </td>
                    <td className="px-5 py-3 font-medium">{order.order_id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{order.shipping_address?.full_name || "—"}</p>
                      <p className="text-xs text-charcoal-muted">{order.shipping_address?.city || ""}</p>
                    </td>
                    <td className="px-5 py-3 text-xs">{order.items?.length || 0} item(s)</td>
                    <td className="px-5 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={statusColor(order.order_status)}>{order.order_status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-charcoal-muted">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {hasPerm("orders", "edit") && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={shipping}
                          onClick={() => handleShipSelected([order.id])}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Ship
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- Track Shipments ---
  const handleTrack = async () => {
    if (!trackSearch.trim()) return;
    setLoadingTrack(true);
    setTrackError("");
    setTrackingData(null);
    try {
      const res = await fetch(`/api/shipping/track?q=${encodeURIComponent(trackSearch.trim())}`);
      const data = await res.json();
      if (data.success) {
        setTrackingData(data.data);
      } else {
        setTrackError(data.error || "Tracking not found");
      }
    } catch {
      setTrackError("Failed to fetch tracking info");
    } finally {
      setLoadingTrack(false);
    }
  };

  const renderTrack = () => (
    <div className="space-y-4">
      <div className="bg-white border border-ivory-dark/60 rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter Shipment ID or AWB code..."
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
          </div>
          <Button onClick={handleTrack} isLoading={loadingTrack}>
            <Search className="h-4 w-4 mr-1.5" />
            Track
          </Button>
        </div>
      </div>

      {trackError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {trackError}
        </div>
      )}

      {trackingData && (
        <div className="space-y-4">
          <div className="bg-white border border-ivory-dark/60 rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">Status</p>
                <Badge variant={trackingData.current_status === "Delivered" ? "success" : "new"}>
                  {trackingData.current_status}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">AWB</p>
                <p className="text-sm font-mono font-medium">{trackingData.awb_code}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">Location</p>
                <p className="text-sm">{trackingData.current_location || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">Est. Delivery</p>
                <p className="text-sm">{trackingData.estimated_delivery ? formatDate(trackingData.estimated_delivery) : "—"}</p>
              </div>
            </div>
            {trackingData.track_url && (
              <a
                href={trackingData.track_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-xs text-gold-dark hover:underline"
              >
                View on carrier site <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {trackingData.tracking_data && trackingData.tracking_data.length > 0 && (
            <div className="bg-white border border-ivory-dark/60 rounded-xl p-5 shadow-sm">
              <h4 className="text-[13px] font-semibold text-charcoal mb-4">Tracking Timeline</h4>
              <div className="space-y-0">
                {[...trackingData.tracking_data].reverse().map((event, i) => (
                  <div key={i} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${i === 0 ? "bg-gold-dark border-gold-dark" : "bg-white border-ivory-dark"}`} />
                      {i < trackingData.tracking_data.length - 1 && <div className="w-px flex-1 bg-ivory-dark mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${i === 0 ? "text-charcoal" : "text-charcoal-muted"}`}>{event.status}</p>
                      <div className="flex gap-3 mt-0.5 text-xs text-charcoal-muted">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {event.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // --- Shipping Rates ---
  const handleGetRates = async () => {
    if (!ratePickup || !rateDelivery || !rateWeight) {
      toast.error("Fill all fields");
      return;
    }
    setLoadingRates(true);
    setRates([]);
    try {
      const res = await fetch(
        `/api/admin/shiprocket/rates?pickup=${ratePickup}&delivery=${rateDelivery}&weight=${rateWeight}`
      );
      const data = await res.json();
      if (data.success) {
        setRates(data.data);
        if (data.data.length === 0) toast("No couriers found for this route");
      } else {
        toast.error(data.error || "Failed to fetch rates");
      }
    } catch {
      toast.error("Failed to fetch rates");
    } finally {
      setLoadingRates(false);
    }
  };

  const renderRates = () => (
    <div className="space-y-4">
      <div className="bg-white border border-ivory-dark/60 rounded-xl p-5 shadow-sm">
        <h3 className="text-[13px] font-semibold text-charcoal mb-4">Check Shipping Rates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            label="Pickup Postcode"
            placeholder="e.g. 110001"
            value={ratePickup}
            onChange={(e) => setRatePickup(e.target.value)}
          />
          <Input
            label="Delivery Postcode"
            placeholder="e.g. 400001"
            value={rateDelivery}
            onChange={(e) => setRateDelivery(e.target.value)}
          />
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            value={rateWeight}
            onChange={(e) => setRateWeight(e.target.value)}
          />
          <div className="flex items-end">
            <Button onClick={handleGetRates} isLoading={loadingRates} className="w-full">
              <Search className="h-4 w-4 mr-1.5" />
              Get Rates
            </Button>
          </div>
        </div>
      </div>

      {rates.length > 0 && (
        <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                  <th className="px-5 py-3">Courier</th>
                  <th className="px-5 py-3">Rate</th>
                  <th className="px-5 py-3">Est. Days</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((c) => (
                  <tr key={c.courier_company_id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                    <td className="px-5 py-3 font-medium">{c.courier_name}</td>
                    <td className="px-5 py-3 font-medium">{formatPrice(c.rate)}</td>
                    <td className="px-5 py-3">{c.estimated_delivery_days} day(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // --- Cancel Modal ---
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/admin/shiprocket/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment_id: cancelTarget.shipment_id,
          order_id: cancelTarget.order_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Shipment cancelled");
        setCancelTarget(null);
        fetchDashboard();
        fetchUnshippedOrders();
      } else {
        toast.error(data.error || "Failed to cancel");
      }
    } catch {
      toast.error("Failed to cancel shipment");
    } finally {
      setCancelling(false);
    }
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: Package },
    { id: "ship" as const, label: "Ship Orders", icon: Send },
    { id: "track" as const, label: "Track", icon: Search },
    { id: "rates" as const, label: "Rates", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Shipping Management</p>
        <h1 className="text-2xl font-serif font-bold text-charcoal">Shiprocket</h1>
        <p className="text-[13px] text-charcoal-muted mt-0.5">Manage shipments, tracking, and shipping rates</p>
      </div>

      <div className="flex gap-1 bg-white border border-ivory-dark/60 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-charcoal text-ivory"
                : "text-charcoal-muted hover:bg-ivory-dark/40"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "ship" && renderShipOrders()}
      {activeTab === "track" && renderTrack()}
      {activeTab === "rates" && renderRates()}

      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Shipment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-muted">
            Cancel shipment for order <strong>{cancelTarget?.order_id_display}</strong>? This will mark the order as cancelled.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
              Keep Shipment
            </Button>
            <Button variant="danger" size="sm" isLoading={cancelling} onClick={handleCancel}>
              Cancel Shipment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
