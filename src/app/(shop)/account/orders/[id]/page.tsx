"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Check, X, Package, Truck, MapPin, CreditCard, ExternalLink, ArrowLeft, Clock } from "lucide-react";
import toast from "react-hot-toast";
import type { Order, User } from "@/types";

const STATUS_FLOW = ["pending", "confirmed", "processing", "packed", "shipped", "out-for-delivery", "delivered"];
function getCurrentStep(status: string) { return STATUS_FLOW.indexOf(status); }
function isCancelable(status: string) { return ["pending", "confirmed"].includes(status); }

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [fetching, setFetching] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [trackingEvents, setTrackingEvents] = useState<{ status: string; location: string; timestamp: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [resolvedParams, authRes] = await Promise.all([
          params,
          fetch("/api/auth/me"),
        ]);
        if (cancelled) return;

        if (!authRes.ok) {
          window.location.replace("/login?redirect=%2Faccount%2Forders");
          return;
        }
        const authData = await authRes.json();
        if (!authData.user) {
          window.location.replace("/login?redirect=%2Faccount%2Forders");
          return;
        }
        setUser(authData.user);

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", resolvedParams.id)
          .eq("user_id", authData.user.id)
          .single();
        if (cancelled) return;

        if (error || !data) {
          window.location.replace("/account/orders");
          return;
        }
        setOrder(data as Order);
      } catch {
        if (!cancelled) window.location.replace("/login?redirect=%2Faccount%2Forders");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFetching(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [params, supabase]);

  useEffect(() => {
    if (!order?.id || !order?.tracking_id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tracking?order_id=${order.id}`);
        const data = await res.json();
        if (!cancelled && data.success && data.data?.events?.length > 0) {
          setTrackingEvents(data.data.events);
        }
      } catch { /* ok */ }
    })();
    return () => { cancelled = true; };
  }, [order?.id, order?.tracking_id]);

  async function handleCancel() {
    if (!order) return;
    if (!isCancelable(order.order_status)) {
      toast.error("This order cannot be cancelled");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to cancel this order? This action cannot be undone.");
    if (!confirmed) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
      const json = await res.json();
      if (json.success) {
        setOrder((prev) => prev ? { ...prev, order_status: "cancelled" as const, updated_at: new Date().toISOString() } : null);
        toast.success("Order cancelled successfully");
      } else { toast.error(json.error ?? "Failed to cancel order"); }
    } catch {
      toast.error("Something went wrong");
    }
    setCancelling(false);
  }

  function getStatusColor(value: string) { return ORDER_STATUSES.find((s) => s.value === value)?.color ?? "text-charcoal-muted bg-ivory-dark/50"; }
  function getStatusLabel(value: string) { return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value; }

  if (loading || !user || fetching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) return null;

  const currentStep = getCurrentStep(order.order_status);
  const cancelled = order.order_status === "cancelled";
  const returned = order.order_status === "returned";
  const canCancel = isCancelable(order.order_status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 page-enter">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-charcoal-muted hover:text-gold-dark mb-8 transition-all duration-300 hover:-translate-x-1 group">
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Order Details</span>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">Order #{order.order_id}</h1>
          <p className="text-sm text-charcoal-muted mt-1.5">Placed on {formatDate(order.created_at)}</p>
        </div>
        <span className={`inline-flex items-center px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.order_status)}`}>{getStatusLabel(order.order_status)}</span>
      </div>

      {/* Cancelled Banner */}
      {cancelled && (
        <div className="bg-rose-50/80 border border-rose-200/50 p-5 mb-6 rounded-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 flex items-center justify-center rounded-full flex-shrink-0">
              <X className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="font-semibold text-rose-800">Order Cancelled</p>
              <p className="text-sm text-rose-600">This order was cancelled on {formatDate(order.updated_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Returned Banner */}
      {returned && (
        <div className="bg-ivory-dark/30 border border-ivory-dark p-5 mb-6 rounded-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ivory-dark flex items-center justify-center rounded-full flex-shrink-0">
              <Package className="h-5 w-5 text-charcoal-muted" />
            </div>
            <div>
              <p className="font-semibold text-charcoal">Order Returned</p>
              <p className="text-sm text-charcoal-muted">This order has been returned</p>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Book Info Banner */}
      {order.is_prebook && (
        <div className="bg-amber-50 border border-amber-200 p-5 mb-6 rounded-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 flex items-center justify-center rounded-full flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Pre-Book Order</p>
              <p className="text-sm text-amber-600">
                Deposit paid: {formatPrice(order.prebook_amount || 0)} &middot; Balance due on delivery: {formatPrice(order.balance_amount || 0)}
              </p>
              {order.prebook_note && <p className="text-xs text-amber-500 mt-1">{order.prebook_note}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      {!cancelled && !returned && (
        <div className="bg-ivory border border-ivory-dark/60 p-6 mb-6 shadow-sm rounded-lg animate-in fade-in">
          <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted mb-5">Order Status</h2>
          <div className="hidden sm:flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-ivory-dark" />
            <div className="absolute top-5 left-0 h-[2px] bg-charcoal transition-all duration-700" style={{ width: `${(currentStep / (STATUS_FLOW.length - 1)) * 100}%` }} />
            {STATUS_FLOW.map((step, idx) => {
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-all duration-500 ${isActive ? "bg-charcoal text-ivory" : "bg-ivory-dark text-charcoal-muted border border-ivory-dark"} ${isCurrent ? "ring-4 ring-gold/30 scale-110" : ""}`}>
                    {isActive && idx < currentStep ? <Check className="h-5 w-5" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] mt-2.5 text-center font-medium uppercase tracking-wider transition-colors ${isActive ? "text-charcoal" : "text-charcoal-muted"}`}>{getStatusLabel(step)}</span>
                </div>
              );
            })}
          </div>
          <div className="sm:hidden space-y-3">
            {STATUS_FLOW.map((step, idx) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${idx <= currentStep ? "bg-charcoal text-ivory" : "bg-ivory-dark text-charcoal-muted"}`}>
                  {idx <= currentStep && idx < currentStep ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span className={`text-sm ${idx <= currentStep ? "font-medium text-charcoal" : "text-charcoal-muted"}`}>{getStatusLabel(step)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.tracking_id && (
        <div className="bg-ivory border border-ivory-dark/60 p-6 mb-6 shadow-sm rounded-lg animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/5 border border-gold/15 flex items-center justify-center rounded-full">
                <Truck className="h-5 w-5 text-gold-dark" />
              </div>
              <div>
                <p className="font-medium text-charcoal">Tracking ID</p>
                <p className="text-sm text-charcoal-muted font-mono">{order.tracking_id}</p>
                {order.courier_name && <p className="text-xs text-charcoal-muted/60">{order.courier_name}</p>}
              </div>
            </div>
            <a href={`https://shiprocket.co/tracking/${order.shiprocket_shipment_id || order.tracking_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] font-semibold text-gold-dark hover:text-gold transition-colors group">
              Track <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
          {order.estimated_delivery && <p className="text-sm text-charcoal-muted mt-3">Estimated delivery: {formatDate(order.estimated_delivery)}</p>}
          {trackingEvents.length > 0 && (
            <div className="mt-5 border-t border-ivory-dark/60 pt-5">
              <p className="text-xs uppercase tracking-[0.15em] font-medium text-charcoal-muted mb-3">Tracking Updates</p>
              <div className="space-y-3">
                {trackingEvents.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 transition-all ${idx === 0 ? "bg-green-500 ring-2 ring-green-500/20" : "bg-charcoal/15"}`} />
                    <div>
                      <p className="text-sm font-medium text-charcoal">{event.status}</p>
                      <p className="text-xs text-charcoal-muted">{event.location} &middot; {new Date(event.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-ivory border border-ivory-dark/60 p-6 mb-6 shadow-sm rounded-lg animate-in fade-in">
        <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted mb-5">Items ({order.items.length})</h2>
        <div className="divide-y divide-ivory-dark">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 group/item">
              <div className="relative h-20 w-20 flex-shrink-0 bg-charcoal/5 rounded-lg overflow-hidden">
                <Image src={item.product.images[0] ?? "/placeholder.svg"} alt={item.product.name} fill className="object-cover group-hover/item:scale-110 transition-transform duration-500" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-charcoal group-hover/item:text-gold-dark transition-colors">{item.product.name}</p>
                <p className="text-xs text-charcoal-muted mt-0.5">{item.color} &middot; {item.size} &middot; Qty: {item.quantity}</p>
                <p className="text-sm font-semibold text-charcoal mt-1">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Address & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-ivory border border-ivory-dark/60 p-6 shadow-sm rounded-lg animate-in fade-in">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-ivory-dark flex items-center justify-center rounded-full">
              <MapPin className="h-4 w-4 text-charcoal-muted" />
            </div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted">Shipping Address</h2>
          </div>
          <div className="text-sm text-charcoal space-y-1">
            <p className="font-semibold">{order.shipping_address.full_name}</p>
            <p className="text-charcoal-muted">{order.shipping_address.street}</p>
            <p className="text-charcoal-muted">{order.shipping_address.city}, {order.shipping_address.state} &ndash; {order.shipping_address.pincode}</p>
            <p className="text-charcoal-muted">Phone: {order.shipping_address.phone}</p>
          </div>
        </div>
        <div className="bg-ivory border border-ivory-dark/60 p-6 shadow-sm rounded-lg animate-in fade-in">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-ivory-dark flex items-center justify-center rounded-full">
              <CreditCard className="h-4 w-4 text-charcoal-muted" />
            </div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted">Payment Info</h2>
          </div>
          <div className="text-sm text-charcoal space-y-1">
            <p>Method: <span className="font-medium">{order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method === "upi" ? "UPI Payment" : order.payment_method === "cashfree" ? "Online (Cashfree)" : "Online"}</span></p>
            <p className="capitalize">Status: <span className={`font-semibold ${order.payment_status === "paid" ? "text-green-600" : order.payment_status === "failed" ? "text-rose-600" : "text-yellow-600"}`}>{order.payment_status}</span></p>
          </div>
          <div className="border-t border-ivory-dark/60 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-charcoal-muted"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-charcoal-muted"><span>Shipping</span><span>{order.shipping_charge === 0 ? "Free" : formatPrice(order.shipping_charge)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span><span>&minus;{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between font-bold text-charcoal pt-2 border-t border-ivory-dark/60 text-base"><span>Total{order.is_prebook ? " (Paid Now)" : ""}</span><span>{formatPrice(order.total)}</span></div>
            {order.is_prebook && order.balance_amount > 0 && (
              <div className="bg-amber-100/50 p-3 rounded-lg mt-2">
                <div className="flex justify-between text-sm text-amber-700 font-medium">
                  <span>Balance Due on Delivery</span>
                  <span>{formatPrice(order.balance_amount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Button — only for pending/confirmed */}
      {canCancel && (
        <div className="text-center py-6 border-t border-ivory-dark animate-in fade-in">
          <Button variant="danger" size="md" isLoading={cancelling} onClick={handleCancel}>
            Cancel Order
          </Button>
        </div>
      )}

      {/* Invoice for delivered */}
      {order.order_status === "delivered" && (
        <div className="text-center py-6 border-t border-ivory-dark animate-in fade-in">
          <Link href={`/account/orders/${order.id}/invoice`} className="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-gold-dark transition-colors group">
            Download Invoice
            <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
