"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Package, ChevronRight } from "lucide-react";
import type { Order } from "@/types";

export default function OrdersPage() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const mounted = useHydrated();
  const authLoading = useAuthStore((s) => s.loading);
  const supabase = useRef(createClient()).current;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      window.location.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, authLoading, user, pathname]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
        if (!cancelled && !error && data) setOrders(data as Order[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  function getStatusStyle(value: string) {
    return ORDER_STATUSES.find((s) => s.value === value)?.color ?? "text-charcoal-muted bg-ivory-dark/50";
  }
  function getStatusLabel(value: string) {
    return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;
  }

  if (!mounted || authLoading || !user || loading) {
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
          <h2 className="text-lg font-serif font-bold text-charcoal mb-2">No orders yet</h2>
          <p className="text-charcoal-muted mb-6">Start shopping to see your orders here</p>
          <Link href="/products/all"><Button>Browse Products</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="block bg-ivory border border-ivory-dark p-5 hover:border-gold/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-charcoal-muted">#{order.order_id}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(order.order_status)}`}>{getStatusLabel(order.order_status)}</span>
                  </div>
                  <p className="text-sm text-charcoal-muted">{formatDate(order.created_at)} &middot; {order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                  <p className="text-lg font-semibold text-charcoal mt-1">{formatPrice(order.total)}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-charcoal-muted flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
