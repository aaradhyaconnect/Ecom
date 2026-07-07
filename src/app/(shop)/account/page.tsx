"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPrice, formatDate, getInitials } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Package, MapPin, LogOut, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import type { Order, Address } from "@/types";

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-24 w-full mb-6" />
      <Skeleton className="h-48 w-full mb-6" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const mounted = useHydrated();
  const authLoading = useAuthStore((s) => s.loading);
  const supabase = useRef(createClient()).current;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<Address>({
    full_name: "", phone: "", street: "", city: "", state: "", pincode: "", landmark: "",
  });

  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      redirectTimer.current = setTimeout(() => {
        window.location.replace("/login?redirect=%2Faccount");
      }, 100);
    }
    return () => { if (redirectTimer.current) clearTimeout(redirectTimer.current); };
  }, [mounted, authLoading, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("profiles").select("addresses").eq("id", user.id).single(),
        ]);
        if (cancelled) return;
        if (ordersRes.data) setOrders(ordersRes.data as Order[]);
        if (!profileRes.error && profileRes.data?.addresses) setAddresses(profileRes.data.addresses as Address[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, supabase]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user?.id, user?.name, user?.phone]);

  async function handleSaveProfile() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name, phone }).eq("id", user!.id);
    if (error) {
      toast.error(error.message);
    } else {
      useAuthStore.getState().setUser({ ...user!, name, phone });
      toast.success("Profile updated");
    }
    setSaving(false);
  }

  async function handleAddAddress() {
    if (!addressForm.full_name.trim()) { toast.error("Name is required"); return; }
    if (!addressForm.phone.trim()) { toast.error("Phone is required"); return; }
    if (!addressForm.street.trim()) { toast.error("Street is required"); return; }
    if (!addressForm.city.trim()) { toast.error("City is required"); return; }
    if (!addressForm.state.trim()) { toast.error("State is required"); return; }
    if (!/^\d{6}$/.test(addressForm.pincode)) { toast.error("Valid 6-digit pincode required"); return; }

    const updated = [...addresses, addressForm];
    const { error } = await supabase.from("profiles").update({ addresses: updated }).eq("id", user!.id);
    if (error) {
      toast.error(error.message);
    } else {
      setAddresses(updated);
      setShowAddressForm(false);
      setAddressForm({ full_name: user?.name ?? "", phone: user?.phone ?? "", street: "", city: "", state: "", pincode: "", landmark: "" });
      toast.success("Address added");
    }
  }

  async function handleRemoveAddress(idx: number) {
    const updated = addresses.filter((_, i) => i !== idx);
    const { error } = await supabase.from("profiles").update({ addresses: updated }).eq("id", user!.id);
    if (error) {
      toast.error(error.message);
    } else {
      setAddresses(updated);
      toast.success("Address removed");
    }
  }

  async function handleLogout() {
    try { await supabase.auth.signOut(); } catch { /* ok */ }
    await fetch("/api/auth/set-session", { method: "DELETE" }).catch(() => {});
    logout();
    window.location.replace("/");
  }

  function getStatusStyle(v: string) {
    return ORDER_STATUSES.find((s) => s.value === v)?.color ?? "";
  }

  function getStatusLabel(v: string) {
    return ORDER_STATUSES.find((s) => s.value === v)?.label ?? v;
  }

  if (!mounted || authLoading || !user) return <LoadingSkeleton />;
  if (loading) return <LoadingSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Account</span>
        <h1 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal mt-1">My Profile</h1>
      </div>

      {/* Profile */}
      <div className="bg-ivory border border-ivory-dark p-6 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ivory-dark">
          <div className="h-16 w-16 bg-charcoal text-ivory flex items-center justify-center text-xl font-bold flex-shrink-0">
            {getInitials(user.name)}
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-charcoal">{user.name}</h2>
            <p className="text-sm text-charcoal-muted">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add phone number" />
        </div>
        <Button onClick={handleSaveProfile} isLoading={saving}>Save Changes</Button>
      </div>

      {/* Addresses */}
      <div className="bg-ivory border border-ivory-dark p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-charcoal-muted" />
            <h2 className="font-serif font-bold text-sm text-charcoal uppercase tracking-wider">Addresses</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddressForm(!showAddressForm)}>
            {showAddressForm ? "Cancel" : "Add Address"}
          </Button>
        </div>

        {showAddressForm && (
          <div className="bg-ivory-dark/30 p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Full Name" value={addressForm.full_name} onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })} />
              <Input label="Phone" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
            </div>
            <Input label="Street" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
              <Input label="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
              <Input label="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
            </div>
            <Input label="Landmark (optional)" value={addressForm.landmark ?? ""} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} />
            <Button onClick={handleAddAddress} fullWidth>Save Address</Button>
          </div>
        )}

        {addresses.length === 0 && !showAddressForm && (
          <p className="text-sm text-charcoal-muted/50 py-4 text-center">No saved addresses</p>
        )}

        <div className="space-y-3">
          {addresses.map((addr, idx) => (
            <div key={idx} className="flex items-start justify-between border border-ivory-dark p-3">
              <div className="text-sm text-charcoal">
                <p className="font-medium">{addr.full_name}</p>
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.state} &ndash; {addr.pincode}</p>
                <p className="text-charcoal-muted">{addr.phone}</p>
              </div>
              <button onClick={() => handleRemoveAddress(idx)} className="text-xs text-rose-500 hover:underline flex-shrink-0 ml-2">Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-ivory border border-ivory-dark p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-charcoal-muted" />
            <h2 className="font-serif font-bold text-sm text-charcoal uppercase tracking-wider">Recent Orders</h2>
          </div>
          <Link href="/account/orders" className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted hover:text-charcoal transition-colors">View All</Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-charcoal-muted/50 py-4 text-center">No orders yet</p>
        ) : (
          <div className="divide-y divide-ivory-dark">
            {orders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="flex items-center justify-between py-3 hover:bg-ivory-dark/30 -mx-6 px-6 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-charcoal-muted">#{order.order_id}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${getStatusStyle(order.order_status)}`}>{getStatusLabel(order.order_status)}</span>
                  </div>
                  <p className="text-xs text-charcoal-muted/60 mt-0.5">
                    {formatDate(order.created_at)} &middot; {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-sm font-semibold text-charcoal">{formatPrice(order.total)}</span>
                  <ChevronRight className="h-4 w-4 text-charcoal-muted" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-4">
        <Button variant="ghost" onClick={handleLogout} className="text-rose-500 hover:text-rose-700">
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
