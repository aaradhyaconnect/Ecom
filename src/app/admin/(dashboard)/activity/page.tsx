"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import toast from "react-hot-toast";

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const entityFilters = [
  { value: "", label: "All Entities" },
  { value: "product", label: "Product" },
  { value: "order", label: "Order" },
  { value: "customer", label: "Customer" },
  { value: "settings", label: "Settings" },
  { value: "coupon", label: "Coupon" },
  { value: "banner", label: "Banner" },
  { value: "staff", label: "Staff" },
];

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(dateString);
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (entityFilter) params.set("entity", entityFilter);
      const res = await fetch(`/api/admin/activity?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      } else {
        toast.error("Failed to load activity logs");
      }
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Audit Trail</span>
        <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Activity Log</h1>
        <p className="text-[13px] text-charcoal-muted mt-0.5">Track all system and user actions</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-charcoal-muted">
          <Filter className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-wider font-medium">Filter:</span>
        </div>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="text-[13px] border border-ivory-dark/60 rounded-lg px-3 py-1.5 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/10"
        >
          {entityFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <span className="text-[12px] text-charcoal-muted ml-auto">{total} total entries</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-ivory-dark/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] text-charcoal-muted uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-charcoal-muted">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-charcoal-muted">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-charcoal-muted" />
                    No activity logs found
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                  <td className="px-5 py-3 text-[12px] text-charcoal-muted whitespace-nowrap">
                    {timeAgo(log.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-charcoal/5 text-charcoal">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gold/10 text-gold-dark capitalize">
                      {log.entity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-charcoal-muted max-w-[200px] truncate">
                    {log.entity_id ? `#${log.entity_id}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-charcoal-muted">
                    {log.user_id ? log.user_id.slice(0, 8) + "…" : "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-charcoal-muted">{total} entries total</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-[12px] text-charcoal-muted">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] border border-ivory-dark/60 hover:bg-ivory-dark/40 disabled:opacity-40 rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
