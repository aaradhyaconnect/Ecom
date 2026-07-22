"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Package, ChevronRight, Truck } from "lucide-react";
import type { Order, User } from "@/types";

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (!data.user) {
            window.location.replace("/login?redirect=%2Faccount%2Forders");
            return;
          }
          setUser(data.user);
        } else {
          window.location.replace("/login?redirect=%2Faccount%2Forders");
          return;
        }
      } catch {
        if (!cancelled) window.location.replace("/login?redirect=%2Faccount%2Forders");
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function fetchOrders() {
      try {
        const { data, error } = await supabase
          .from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
        if (!cancelled && !error && data) setOrders(data as Order[]);
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    fetchOrders();
    function onVisible() { if (document.visibilityState === "visible") fetchOrders(); }
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  function getStatusStyle(value: string) {
    return ORDER_STATUSES.find((s) => s.value === value)?.color ?? "text-charcoal-muted bg-ivory-dark/50";
  }
  function getStatusLabel(value: string) {
    return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;
  }

  if (loading || !user || fetching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full mb-6" />
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Orders</span>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-charcoal/10 mb-4" />
          <div className="w-12 h-[1px] bg-gold/30 mx-auto mb-4" />
          <h2 className="text-lg font-serif font-bold text-charcoal mb-2">No orders yet</h2>
          <p className="text-charcoal-muted mb-6">Start shopping to see your orders here</p>
          <Link href="/products/all"><Button variant="outline">Browse Products</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="block bg-ivory border border-ivory-dark/60 p-5 hover:border-gold/30 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-charcoal-muted">#{order.order_id}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(order.order_status)}`}>{getStatusLabel(order.order_status)}</span>
                    {order.tracking_id && (
                      <span className="inline-flex items-center gap-1 text-xs text-charcoal-muted">
                        <Truck className="h-3 w-3" />
                        {order.courier_name || "Shipped"} — {order.tracking_id}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal-muted">{formatDate(order.created_at)} &middot; {order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                  <p className="text-lg font-semibold text-charcoal mt-1">{formatPrice(order.total)}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-charcoal-muted flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
