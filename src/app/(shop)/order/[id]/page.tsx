"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Check, X, Package, Truck, MapPin, CreditCard, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { Order } from "@/types";

const STATUS_FLOW = ["pending", "confirmed", "shipped", "out-for-delivery", "delivered"];

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
  const { user } = useAuthStore();
  const supabase = createClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadOrder();
  }, [user]);

  async function loadOrder() {
    const { id } = await params;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user?.id)
      .single();

    if (error || !data) {
      router.push("/orders");
      return;
    }
    setOrder(data as Order);
    setLoading(false);
  }

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
    return s?.color ?? "text-gray-600 bg-gray-50";
  }

  function getStatusLabel(value: string) {
    const s = ORDER_STATUSES.find((st) => st.value === value);
    return s?.label ?? value;
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
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
        onClick={() => router.push("/orders")}
        className="text-sm text-gray-500 hover:text-black mb-4 inline-flex items-center gap-1 transition-colors"
      >
        &larr; Back to Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.order_id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}
        >
          {getStatusLabel(order.order_status)}
        </span>
      </div>

      {!cancelled && !returned && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isActive
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-gray-200" : ""}`}
                    >
                      {isActive && idx < currentStep ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center font-medium ${
                        isActive ? "text-black" : "text-gray-400"
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
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isActive ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isActive && idx < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-sm ${isActive ? "text-black font-medium" : "text-gray-400"}`}>
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <X className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-medium text-red-800">Order Cancelled</p>
              <p className="text-sm text-red-600">
                This order was cancelled on {formatDate(order.updated_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {returned && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-gray-500" />
            <div>
              <p className="font-medium text-gray-800">Order Returned</p>
              <p className="text-sm text-gray-600">This order has been returned</p>
            </div>
          </div>
        </div>
      )}

      {order.tracking_id && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Tracking ID</p>
                <p className="text-sm text-gray-500 font-mono">{order.tracking_id}</p>
                {order.courier_name && (
                  <p className="text-xs text-gray-400">{order.courier_name}</p>
                )}
              </div>
            </div>
            <a
              href={`https://shiprocket.co/tracking/${order.tracking_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-black hover:underline"
            >
              Track <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          {order.estimated_delivery && (
            <p className="text-sm text-gray-500 mt-2">
              Estimated delivery: {formatDate(order.estimated_delivery)}
            </p>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">
          Items ({order.items.length})
        </h2>
        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={item.product.images[0] ?? "/placeholder.png"}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.color} &middot; {item.size} &middot; Qty: {item.quantity}
                </p>
                <p className="text-sm font-semibold mt-1">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">
              Shipping Address
            </h2>
          </div>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p className="font-medium">{order.shipping_address.full_name}</p>
            <p>{order.shipping_address.street}</p>
            <p>
              {order.shipping_address.city}, {order.shipping_address.state} &ndash; {order.shipping_address.pincode}
            </p>
            <p>Phone: {order.shipping_address.phone}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">
              Payment Info
            </h2>
          </div>
          <div className="text-sm text-gray-700 space-y-0.5">
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
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              >
                {order.payment_status}
              </span>
            </p>
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span>{order.shipping_charge === 0 ? "Free" : formatPrice(order.shipping_charge)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                <span>&minus;{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {isCancelable(order.order_status) && (
        <div className="text-center py-4">
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
    </div>
  );
}
