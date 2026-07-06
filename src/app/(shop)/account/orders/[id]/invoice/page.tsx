"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { Printer, ArrowLeft } from "lucide-react";
import type { Order } from "@/types";

export default function InvoicePage({
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

  if (!user || !authChecked || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!order) return null;

  const items = (order.items as Array<{
    product: { name: string; price: number; images?: string[] };
    quantity: number;
    size?: string;
    color?: string;
  }>) || [];

  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="no-print mb-6 flex items-center justify-between">
        <button
          onClick={() => window.location.replace(`/account/orders/${order.id}`)}
          className="text-xs tracking-[0.1em] uppercase text-charcoal-muted hover:text-charcoal inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Order
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-charcoal text-ivory px-4 py-2 text-sm font-medium hover:bg-charcoal/90 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-8 print:p-6 print:border-0 print:shadow-none">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-charcoal">HAINJU</h1>
            <p className="text-sm text-gray-500 mt-1">Premium Designer Clothing & Jewellery</p>
            <p className="text-xs text-gray-400 mt-2">123 Fashion Street, Boutique Lane</p>
            <p className="text-xs text-gray-400">Mumbai - 400001, India</p>
            <p className="text-xs text-gray-400">hello@hainju.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-charcoal">INVOICE</h2>
            <p className="text-sm text-gray-500 mt-1">#{order.order_id}</p>
            <p className="text-xs text-gray-400 mt-1">Date: {formatDate(order.created_at)}</p>
            <p className="text-xs text-gray-400">
              Payment: {order.payment_method === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}
            </p>
            <p className="text-xs text-gray-400">
              Status: {order.payment_status?.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Bill To</h3>
            <p className="text-sm font-medium text-charcoal">{order.shipping_address?.full_name}</p>
            <p className="text-xs text-gray-500">{order.shipping_address?.street}</p>
            <p className="text-xs text-gray-500">
              {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
            </p>
            <p className="text-xs text-gray-500">Phone: {order.shipping_address?.phone}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Ship To</h3>
            <p className="text-sm text-gray-600">Same as billing address</p>
          </div>
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left text-xs font-bold uppercase tracking-wider text-gray-500 py-2">#</th>
              <th className="text-left text-xs font-bold uppercase tracking-wider text-gray-500 py-2">Item</th>
              <th className="text-left text-xs font-bold uppercase tracking-wider text-gray-500 py-2">Size/Color</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 py-2">Qty</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 py-2">Price</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-500">{idx + 1}</td>
                <td className="py-3">
                  <p className="text-sm font-medium text-charcoal">{item.product?.name}</p>
                </td>
                <td className="py-3 text-xs text-gray-500">
                  {[item.size, item.color].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="py-3 text-sm text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 text-sm text-right text-gray-600">{formatPrice(item.product?.price || 0)}</td>
                <td className="py-3 text-sm text-right font-medium text-charcoal">
                  {formatPrice((item.product?.price || 0) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-charcoal">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="text-charcoal">
                {order.shipping_charge === 0 ? "FREE" : formatPrice(order.shipping_charge)}
              </span>
            </div>
            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">-{formatPrice(order.discount!)}</span>
              </div>
            )}
            {order.coupon_code && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Coupon ({order.coupon_code})</span>
                <span className="text-green-600">{order.coupon_code}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
              <span className="text-charcoal">Total</span>
              <span className="text-charcoal">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            Thank you for shopping with HAINJU. For any queries, contact us at hello@hainju.com
          </p>
        </div>
      </div>
    </div>
  );
}
