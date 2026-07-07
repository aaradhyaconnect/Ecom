"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatPrice, formatDate, getInitials } from "@/lib/utils/format";
import { Users, Search, Mail, Phone, ShoppingBag, IndianRupee, ChevronLeft, ChevronRight, Download } from "lucide-react";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<unknown[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [fetchCustomers]);

  const viewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(customer.email)}`);
      const data = await res.json();
      if (data.success) setCustomerOrders(data.data || []);
    } catch {
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const exportCustomers = () => {
    const headers = ["Name", "Email", "Phone", "Orders", "Total Spent", "Joined"];
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.phone || "",
      String(c.order_count),
      String(c.total_spent),
      formatDate(c.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Customers exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-charcoal-muted">
            View and manage your customers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCustomers}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted/60" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-ivory-dark py-2.5 pl-10 pr-4 text-sm focus:border-gold/60 focus:ring-0"
        />
      </div>

      <div className="border bg-ivory overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-ivory-dark/50 text-left text-xs font-medium text-charcoal-muted">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted/60">
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted/60">
                    <Users className="mx-auto mb-2 h-8 w-8" />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0 hover:bg-ivory-dark/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-ivory-dark flex items-center justify-center text-sm font-medium">
                          {getInitials(customer.name)}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-muted">{customer.email}</td>
                    <td className="px-4 py-3 text-charcoal-muted">
                      {customer.phone || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium">{customer.order_count}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-muted">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => viewCustomer(customer)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-charcoal-muted">
            Page {page} of {totalPages} ({total} customers)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-ivory-dark flex items-center justify-center text-lg font-bold">
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedCustomer.name}</h3>
                <div className="flex items-center gap-3 text-sm text-charcoal-muted">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {selectedCustomer.email}
                  </span>
                  {selectedCustomer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedCustomer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ivory-dark/50 p-4">
                <div className="flex items-center gap-2 text-sm text-charcoal-muted mb-1">
                  <ShoppingBag className="h-4 w-4" />
                  Total Orders
                </div>
                <p className="text-2xl font-bold">{selectedCustomer.order_count}</p>
              </div>
              <div className="bg-ivory-dark/50 p-4">
                <div className="flex items-center gap-2 text-sm text-charcoal-muted mb-1">
                  <IndianRupee className="h-4 w-4" />
                  Total Spent
                </div>
                <p className="text-2xl font-bold">
                  {formatPrice(selectedCustomer.total_spent)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-charcoal-muted mb-2">
                Recent Orders
              </p>
              {ordersLoading ? (
                <p className="text-sm text-charcoal-muted/60">Loading...</p>
              ) : customerOrders.length === 0 ? (
                <p className="text-sm text-charcoal-muted/60">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {(customerOrders as Array<{
                    order_id: string;
                    total: number;
                    order_status: string;
                    created_at: string;
                  }>).slice(0, 5).map((order) => (
                    <div
                      key={order.order_id}
                      className="flex items-center justify-between bg-ivory-dark/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{order.order_id}</p>
                        <p className="text-xs text-charcoal-muted">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatPrice(order.total)}
                        </p>
                        <p className="text-xs text-charcoal-muted capitalize">
                          {order.order_status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
