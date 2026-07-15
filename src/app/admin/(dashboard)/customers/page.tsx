"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAdminPermissions } from "@/app/admin/_components/admin-permissions-provider";
import { formatPrice, formatDate, getInitials } from "@/lib/utils/format";
import { Users, Search, Mail, Phone, ShoppingBag, IndianRupee, ChevronLeft, ChevronRight, Download, Edit, Trash2, Ban } from "lucide-react";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  is_banned?: boolean;
  notes?: string;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export default function AdminCustomersPage() {
  const { hasPerm } = useAdminPermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<unknown[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "customer", notes: "" });
  const [saving, setSaving] = useState(false);

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

  const openEdit = (customer: Customer) => {
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      role: customer.role || "customer",
      notes: customer.notes || "",
    });
    setSelectedCustomer(customer);
    setEditModal(true);
  };

  const saveCustomer = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer updated");
        setEditModal(false);
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const toggleBan = async (customer: Customer) => {
    const action = customer.is_banned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${action} ${customer.name}?`)) return;
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: !customer.is_banned }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Customer ${action}ed`);
        fetchCustomers();
      } else {
        toast.error(data.error || `Failed to ${action}`);
      }
    } catch {
      toast.error(`Failed to ${action} customer`);
    }
  };

  const deleteCustomer = async (customer: Customer) => {
    if (!confirm(`Permanently delete ${customer.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer deleted");
        fetchCustomers();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const exportCustomers = () => {
    const headers = ["Name", "Email", "Phone", "Role", "Orders", "Total Spent", "Joined"];
    const escapeCsv = (val: string) => val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    const rows = customers.map((c) => [
      escapeCsv(c.name),
      c.email,
      c.phone || "",
      c.role || "customer",
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
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Customer Management</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Customers</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">View, edit, and manage your customers</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open("/api/admin/export?type=customers", "_blank")}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Total Spent</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-charcoal-muted">Loading...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-charcoal-muted">
                    <Users className="mx-auto mb-2 h-8 w-8" />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className={`border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors ${customer.is_banned ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-ivory-dark/60 border border-ivory-dark flex items-center justify-center text-sm font-medium">
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <span className="font-medium">{customer.name}</span>
                          {customer.is_banned && <span className="ml-2 text-[10px] text-rose-500 font-semibold uppercase">Banned</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-charcoal-muted">{customer.email}</td>
                    <td className="px-5 py-3 text-charcoal-muted">{customer.phone || "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${customer.role === "admin" ? "bg-gold/10 text-gold-dark" : "bg-ivory-dark text-charcoal-muted"}`}>
                        {customer.role || "customer"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{customer.order_count}</td>
                    <td className="px-5 py-3 font-medium">{formatPrice(customer.total_spent)}</td>
                    <td className="px-5 py-3 text-xs text-charcoal-muted">{formatDate(customer.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewCustomer(customer)} className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-charcoal-muted hover:text-charcoal transition-colors" title="View Details">
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                        {hasPerm("customers", "edit") && (
                          <>
                            <button onClick={() => openEdit(customer)} className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-charcoal-muted hover:text-charcoal transition-colors" title="Edit Customer">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => toggleBan(customer)} className={`p-1.5 rounded-lg hover:bg-ivory-dark/40 transition-colors ${customer.is_banned ? "text-green-500 hover:text-green-600" : "text-orange-500 hover:text-orange-600"}`} title={customer.is_banned ? "Unban" : "Ban"}>
                              <Ban className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {hasPerm("customers", "delete") && (
                          <button onClick={() => deleteCustomer(customer)} className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-rose-500 hover:text-rose-600 transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
          <p className="text-sm text-charcoal-muted">Page {page} of {totalPages} ({total} customers)</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal isOpen={!!selectedCustomer && !editModal} onClose={() => setSelectedCustomer(null)} title="Customer Details" size="lg">
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-ivory-dark/60 border border-ivory-dark flex items-center justify-center text-lg font-bold">
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedCustomer.name}</h3>
                <div className="flex items-center gap-3 text-sm text-charcoal-muted">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedCustomer.email}</span>
                  {selectedCustomer.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedCustomer.phone}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-ivory-dark/40 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-charcoal-muted mb-1"><ShoppingBag className="h-4 w-4" />Total Orders</div>
                <p className="text-2xl font-bold text-charcoal">{selectedCustomer.order_count}</p>
              </div>
              <div className="bg-ivory-dark/40 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-charcoal-muted mb-1"><IndianRupee className="h-4 w-4" />Total Spent</div>
                <p className="text-2xl font-bold text-charcoal">{formatPrice(selectedCustomer.total_spent)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal-muted mb-2">Recent Orders</p>
              {ordersLoading ? <p className="text-sm text-charcoal-muted">Loading...</p> : customerOrders.length === 0 ? <p className="text-sm text-charcoal-muted">No orders yet</p> : (
                <div className="space-y-2">
                  {(customerOrders as Array<{ order_id: string; total: number; order_status: string; created_at: string }>).slice(0, 5).map((order) => (
                    <div key={order.order_id} className="flex items-center justify-between bg-ivory-dark/40 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{order.order_id}</p>
                        <p className="text-xs text-charcoal-muted">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                        <p className="text-xs text-charcoal-muted capitalize">{order.order_status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => { setEditModal(true); }}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
              <Button size="sm" variant="outline" onClick={() => toggleBan(selectedCustomer)}>
                <Ban className="h-4 w-4 mr-1" /> {selectedCustomer.is_banned ? "Unban" : "Ban"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Customer" size="md">
        <div className="space-y-4">
          <Input label="Full Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-gray-900 bg-ivory focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] transition-all duration-300"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Admin Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-gray-900 bg-ivory focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] transition-all duration-300 resize-none"
              placeholder="Internal notes about this customer..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={saveCustomer} isLoading={saving}>Save Changes</Button>
            <Button variant="outline" onClick={() => setEditModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
