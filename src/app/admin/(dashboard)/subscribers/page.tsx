"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Trash2, RefreshCw, Download, Mail, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";
import toast from "react-hot-toast";

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  subscribed_at?: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("filter", filter);
      const res = await fetch(`/api/admin/subscribers?${params}`);
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.data);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleToggle = async (id: string, isActive: boolean) => {
    const res = await fetch("/api/admin/subscribers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !isActive }),
    });
    if (res.ok) {
      toast.success(isActive ? "Unsubscribed" : "Reactivated");
      fetchSubscribers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this subscriber permanently?")) return;
    const res = await fetch(`/api/admin/subscribers?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Subscriber removed"); fetchSubscribers(); }
  };

  const handleExport = () => {
    const csv = "Email,Active,Subscribed\n" + subscribers.map((s) => `${s.email},${s.is_active},${s.created_at}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const activeCount = subscribers.filter((s) => s.is_active).length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Newsletter</span>
          <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Subscribers</h1>
          <p className="text-[13px] text-charcoal-muted/60 mt-0.5">Manage newsletter subscribers</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => { setFilter("all"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "all" ? "border-charcoal bg-charcoal text-ivory shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span className="text-sm font-medium">Total</span></div>
          <p className="mt-1 text-2xl font-bold">{total}</p>
        </button>
        <button onClick={() => { setFilter("active"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "active" ? "border-green-400 bg-green-50 text-green-900 shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-600" /><span className="text-sm font-medium">Active</span></div>
          <p className="mt-1 text-2xl font-bold">{activeCount}</p>
        </button>
        <button onClick={() => { setFilter("inactive"); setPage(1); }} className={`border p-4 text-left transition-all rounded-xl ${filter === "inactive" ? "border-rose-400 bg-rose-50 text-rose-900 shadow-sm" : "bg-white border-ivory-dark/60 hover:shadow-sm"}`}>
          <div className="flex items-center gap-2"><UserX className="h-4 w-4 text-rose-600" /><span className="text-sm font-medium">Inactive</span></div>
          <p className="mt-1 text-2xl font-bold">{total - activeCount}</p>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] text-charcoal-muted/60 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Subscribed</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-16 text-center text-charcoal-muted/50"><RefreshCw className="h-5 w-5 animate-spin mx-auto" /></td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-16 text-center text-charcoal-muted/50"><Users className="h-8 w-8 mx-auto mb-2 text-charcoal-muted/20" />No subscribers</td></tr>
              ) : subscribers.map((sub) => (
                <tr key={sub.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-charcoal/5 rounded-full flex items-center justify-center"><Mail className="h-3.5 w-3.5 text-charcoal-muted/40" /></div>
                      <span className="font-medium text-charcoal">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={sub.is_active ? "success" : "error"}>{sub.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-charcoal-muted/60">{formatDate(sub.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleToggle(sub.id, sub.is_active)} className={`p-1.5 rounded-md transition-colors ${sub.is_active ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`} title={sub.is_active ? "Deactivate" : "Activate"}>
                        {sub.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-charcoal-muted/50">{total} subscribers total</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg">Previous</button>
            <span className="px-3 py-1.5 text-[12px] text-charcoal-muted">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
