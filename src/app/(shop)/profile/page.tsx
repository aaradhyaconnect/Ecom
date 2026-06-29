"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { formatPrice, formatDate, getInitials } from "@/lib/utils/format";
import { ORDER_STATUSES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { User, Package, MapPin, LogOut, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import type { Order, Address } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<Address>({
    full_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    loadOrders();
    loadProfile();
  }, [user]);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setOrders(data as Order[]);
    setLoading(false);
  }

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("addresses")
      .eq("id", user?.id)
      .single();

    if (data?.addresses) setAddresses(data.addresses as Address[]);
  }

  async function handleSaveProfile() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, phone })
      .eq("id", user?.id);

    if (error) {
      toast.error(error.message);
    } else {
      useAuthStore.getState().setUser({ ...user!, name, phone });
      toast.success("Profile updated");
    }
    setSaving(false);
  }

  async function handleAddAddress() {
    const updated = [...addresses, addressForm];
    const { error } = await supabase
      .from("profiles")
      .update({ addresses: updated })
      .eq("id", user?.id);

    if (error) {
      toast.error(error.message);
    } else {
      setAddresses(updated);
      setShowAddressForm(false);
      setAddressForm({ full_name: "", phone: "", street: "", city: "", state: "", pincode: "", landmark: "" });
      toast.success("Address added");
    }
  }

  async function handleRemoveAddress(idx: number) {
    const updated = addresses.filter((_, i) => i !== idx);
    const { error } = await supabase
      .from("profiles")
      .update({ addresses: updated })
      .eq("id", user?.id);

    if (error) {
      toast.error(error.message);
    } else {
      setAddresses(updated);
      toast.success("Address removed");
    }
  }

  function handleLogout() {
    logout();
    supabase.auth.signOut();
    router.push("/");
  }

  function getStatusStyle(v: string) {
    return ORDER_STATUSES.find((s) => s.value === v)?.color ?? "";
  }

  function getStatusLabel(v: string) {
    return ORDER_STATUSES.find((s) => s.value === v)?.label ?? v;
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full rounded-xl mb-6" />
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {getInitials(user.name)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Add phone number"
          />
        </div>
        <Button onClick={handleSaveProfile} isLoading={saving}>
          Save Changes
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">
              Addresses
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddressForm(!showAddressForm)}
          >
            {showAddressForm ? "Cancel" : "Add Address"}
          </Button>
        </div>

        {showAddressForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                value={addressForm.full_name}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, full_name: e.target.value })
                }
              />
              <Input
                label="Phone"
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, phone: e.target.value })
                }
              />
            </div>
            <Input
              label="Street"
              value={addressForm.street}
              onChange={(e) =>
                setAddressForm({ ...addressForm, street: e.target.value })
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="City"
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, city: e.target.value })
                }
              />
              <Input
                label="State"
                value={addressForm.state}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, state: e.target.value })
                }
              />
              <Input
                label="Pincode"
                value={addressForm.pincode}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, pincode: e.target.value })
                }
              />
            </div>
            <Input
              label="Landmark (optional)"
              value={addressForm.landmark ?? ""}
              onChange={(e) =>
                setAddressForm({ ...addressForm, landmark: e.target.value })
              }
            />
            <Button onClick={handleAddAddress} fullWidth>
              Save Address
            </Button>
          </div>
        )}

        {addresses.length === 0 && !showAddressForm && (
          <p className="text-sm text-gray-400 py-4 text-center">
            No saved addresses
          </p>
        )}

        <div className="space-y-3">
          {addresses.map((addr, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between border border-gray-100 rounded-lg p-3"
            >
              <div className="text-sm text-gray-700">
                <p className="font-medium">{addr.full_name}</p>
                <p>{addr.street}</p>
                <p>
                  {addr.city}, {addr.state} &ndash; {addr.pincode}
                </p>
                <p className="text-gray-500">{addr.phone}</p>
              </div>
              <button
                onClick={() => handleRemoveAddress(idx)}
                className="text-xs text-red-500 hover:underline flex-shrink-0 ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">
              Recent Orders
            </h2>
          </div>
          <Link
            href="/orders"
            className="text-sm font-medium text-black hover:underline"
          >
            View All
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No orders yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-500">
                      #{order.order_id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(order.order_status)}`}
                    >
                      {getStatusLabel(order.order_status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(order.created_at)} &middot; {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-4">
        <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-700">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
