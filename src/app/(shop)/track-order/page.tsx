"use client";

import { useState } from "react";
import { Search, Package, Truck, MapPin, Clock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface TrackingEvent {
  status: string;
  location: string;
  date: string;
}

interface TrackResult {
  order_id: string;
  status: string;
  tracking_id: string | null;
  courier_name: string | null;
  estimated_delivery: string | null;
  current_status: string | null;
  current_location: string | null;
  track_url: string | null;
  events: TrackingEvent[];
  items?: { product?: { name?: string; price?: number }; quantity?: number }[];
  shipping_address?: { full_name?: string; city?: string; state?: string };
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error("Please enter your Order ID");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/public/track?order_id=${encodeURIComponent(orderId.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        toast.error(data.error || "Order not found");
      }
    } catch {
      toast.error("Failed to track order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "shipped":
      case "out-for-delivery":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "processing":
      case "confirmed":
        return <Package className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">Track Your Order</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Order Tracking</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
        <p className="text-sm text-charcoal-muted mt-4">Enter your order ID to track your shipment in real-time</p>
      </div>

      <div className="bg-ivory-dark/50 p-8 md:p-12 mb-12">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Enter Order ID (e.g., FD-123)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            aria-label="Order ID"
            className="flex-1 border border-ivory-dark bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-muted focus:border-gold/60 focus:ring-0 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-charcoal text-ivory px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-charcoal-light transition-colors duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-ivory border-t-transparent rounded-full" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Tracking..." : "Track"}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-8">
          <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              {getStatusIcon(result.current_status || result.status)}
              <div className="flex-1">
                <h2 className="text-xl font-serif font-bold text-charcoal">Order {result.order_id}</h2>
                <p className="text-sm text-charcoal-muted mt-1">
                  Status: <span className="font-medium text-charcoal">{result.current_status || result.status}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">Tracking ID</p>
                <p className="text-sm font-mono font-medium">{result.tracking_id || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">Courier</p>
                <p className="text-sm font-medium">{result.courier_name || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">Current Location</p>
                <p className="text-sm">{result.current_location || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-charcoal-muted mb-1">Est. Delivery</p>
                <p className="text-sm">{result.estimated_delivery || "—"}</p>
              </div>
            </div>

            {result.tracking_id && (
              <div className="bg-ivory-dark/50 p-4 rounded-lg">
                <p className="text-xs text-charcoal-muted mb-2">Track on your phone</p>
                <p className="text-sm font-mono font-medium text-charcoal">{result.tracking_id}</p>
                <p className="text-xs text-charcoal-muted mt-1">Use this tracking ID on the courier&apos;s website or app</p>
              </div>
            )}
          </div>

          {result.events && result.events.length > 0 && (
            <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-serif font-bold text-charcoal mb-6">Tracking Timeline</h3>
              <div className="space-y-0">
                {[...result.events].reverse().map((event, i) => (
                  <div key={i} className="flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${i === 0 ? "bg-gold-dark border-gold-dark" : "bg-white border-ivory-dark"}`} />
                      {i < result.events.length - 1 && <div className="w-px flex-1 bg-ivory-dark mt-1" />}
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

          {result.items && result.items.length > 0 && (
            <div className="bg-white border border-ivory-dark/60 rounded-xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-serif font-bold text-charcoal mb-4">Order Items</h3>
              <div className="space-y-3">
                {result.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-ivory-dark/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{item.product?.name || "Product"}</p>
                      <p className="text-xs text-charcoal-muted">Qty: {item.quantity || 1}</p>
                    </div>
                    {item.product?.price && (
                      <p className="text-sm font-medium text-charcoal">₹{item.product.price.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
