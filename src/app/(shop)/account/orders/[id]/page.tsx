"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Check, X, Package, Truck, MapPin, CreditCard, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { Order } from "@/types";

const STATUS_FLOW = ["pending", "confirmed", "packed", "shipped", "out-for-delivery", "delivered"];

function getCurrentStep(status: string): number {
  const idx = STATUS_FLOW.indexOf(status);
  return idx >= 0 ? idx : -1;
}

function isCancelable(status: string): boolean {
  return ["pending", "confirmed"].includes(status);
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const mounted = useHydrated();
  const supabase = createClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => setAuthChecked(true), 800);
    return () => clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !authChecked) return;
    if (!user) {
      window.location.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    async function loadOrder() {
      const { id } = await params;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error || !data) {
        window.location.replace("/account/orders");
        return;
      }
      setOrder(data as Order);
      setLoading(false);
    }

    loadOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mounted, authChecked, params, supabase, router]);

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const json = await res.json();

    if (json.success) {
      setOrder((prev) => prev ? { ...prev, order_status: "cancelled" as const } : null);
      toast.success("Order cancelled successfully");
    } else {
      toast.error(json.error ?? "Failed to cancel order");
    }
    setCancelling(false);
  }

  function getStatusColor(value: string) {
    const s = ORDER_STATUSES.find((st) => st.value === value);
    return s?.color ?? "text-charcoal-muted bg-ivory-dark/50";
  }

  function getStatusLabel(value: string) {
    const s = ORDER_STATUSES.find((st) => st.value === value);
    return s?.label ?? value;
  }

  if (!mounted || !authChecked || !user) return null;

  if (loading) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => window.location.replace("/account/orders")}
        className="text-xs tracking-[0.1em] uppercase text-charcoal-muted hover:text-charcoal mb-6 inline-flex items-center gap-1 transition-colors"
      >
        &larr; Back to Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Order Details</span>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">Order #{order.order_id}</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 text-sm font-medium ${getStatusColor(order.order_status)}`}
        >
          {getStatusLabel(order.order_status)}
        </span>
      </div>

      {!cancelled && !returned && (
        <div className="bg-ivory border border-ivory-dark p-6 mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted mb-4">
            Order Status
          </h2>
          <div className="relative">
            <div className="hidden sm:flex items-center justify-between">
              {STATUS_FLOW.map((step, idx) => {
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 flex items-center justify-center text-sm font-bold transition-all ${
                        isActive
                          ? "bg-charcoal text-ivory"
                          : "bg-charcoal/5 text-charcoal-muted"
                      } ${isCurrent ? "ring-4 ring-gold/30" : ""}`}
                    >
                      {isActive && idx < currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center font-medium ${
                        isActive ? "text-charcoal" : "text-charcoal-muted"
                      }`}
                    >
                      {getStatusLabel(step)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="sm:hidden space-y-3">
              {STATUS_FLOW.map((step, idx) => {
                const isActive = idx <= currentStep;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isActive ? "bg-charcoal text-ivory" : "bg-charcoal/5 text-charcoal-muted"
                      }`}
                    >
                      {isActive && idx < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-sm ${isActive ? "font-medium text-charcoal" : "text-charcoal-muted"}`}>
                      {getStatusLabel(step)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {cancelled && (
        <div className="bg-rose-50 border border-rose-200 p-6 mb-6">
          <div className="flex items-center gap-3">
            <X className="h-6 w-6 text-rose-500" />
            <div>
              <p className="font-medium text-rose-800">Order Cancelled</p>
              <p className="text-sm text-rose-600">
                This order was cancelled on {formatDate(order.updated_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {returned && (
        <div className="bg-charcoal/5 border border-ivory-dark p-6 mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-charcoal-muted" />
            <div>
              <p className="font-medium text-charcoal">Order Returned</p>
              <p className="text-sm text-charcoal-muted">This order has been returned</p>
            </div>
          </div>
        </div>
      )}

      {order.tracking_id && (
        <div className="bg-ivory border border-ivory-dark p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-charcoal-muted" />
              <div>
                <p className="font-medium text-charcoal">Tracking ID</p>
                <p className="text-sm text-charcoal-muted font-mono">{order.tracking_id}</p>
                {order.courier_name && (
                  <p className="text-xs text-charcoal-muted/60">{order.courier_name}</p>
                )}
              </div>
            </div>
            {order.shiprocket_shipment_id ? (
              <a
                href={`https://shiprocket.co/tracking/${order.shiprocket_shipment_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.1em] font-medium text-charcoal hover:text-gold transition-colors"
              >
                Track <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <a
                href={`https://shiprocket.co/tracking/${order.tracking_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.1em] font-medium text-charcoal hover:text-gold transition-colors"
              >
                Track <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {order.estimated_delivery && (
            <p className="text-sm text-charcoal-muted mt-2">
              Estimated delivery: {formatDate(order.estimated_delivery)}
            </p>
          )}
        </div>
      )}

      <div className="bg-ivory border border-ivory-dark p-6 mb-6">
        <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted mb-4">
          Items ({order.items.length})
        </h2>
        <div className="divide-y divide-ivory-dark">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative h-20 w-20 flex-shrink-0 bg-charcoal/5">
                <Image
                  src={item.product.images[0] ?? "/placeholder.png"}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-charcoal">{item.product.name}</p>
                <p className="text-xs text-charcoal-muted mt-0.5">
                  {item.color} &middot; {item.size} &middot; Qty: {item.quantity}
                </p>
                <p className="text-sm font-semibold text-charcoal mt-1">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-ivory border border-ivory-dark p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-charcoal-muted" />
            <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted">
              Shipping Address
            </h2>
          </div>
          <div className="text-sm text-charcoal space-y-0.5">
            <p className="font-medium">{order.shipping_address.full_name}</p>
            <p>{order.shipping_address.street}</p>
            <p>
              {order.shipping_address.city}, {order.shipping_address.state} &ndash; {order.shipping_address.pincode}
            </p>
            <p>Phone: {order.shipping_address.phone}</p>
          </div>
        </div>

        <div className="bg-ivory border border-ivory-dark p-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-charcoal-muted" />
            <h2 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted">
              Payment Info
            </h2>
          </div>
          <div className="text-sm text-charcoal space-y-0.5">
            <p>
              Method:{" "}
              <span className="font-medium">
                {order.payment_method === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}
              </span>
            </p>
            <p className="capitalize">
              Status:{" "}
              <span
                className={`font-medium ${
                  order.payment_status === "paid"
                    ? "text-green-600"
                    : order.payment_status === "failed"
                      ? "text-rose-600"
                      : "text-yellow-600"
                }`}
              >
                {order.payment_status}
              </span>
            </p>
          </div>
          <div className="border-t border-ivory-dark mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-charcoal-muted">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-charcoal-muted">
              <span>Shipping</span>
              <span>{order.shipping_charge === 0 ? "Free" : formatPrice(order.shipping_charge)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                <span>&minus;{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-charcoal pt-2 border-t border-ivory-dark">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {isCancelable(order.order_status) && (
        <div className="text-center py-4 border-t border-ivory-dark">
          <Button
            variant="danger"
            size="md"
            isLoading={cancelling}
            onClick={handleCancel}
          >
            Cancel Order
          </Button>
        </div>
      )}

      {order.order_status === "delivered" && (
        <div className="text-center py-4 border-t border-ivory-dark">
          <a
            href={`/account/orders/${order.id}/invoice`}
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-gold-dark transition-colors"
          >
            Download Invoice
          </a>
        </div>
      )}
    </div>
  );
}
