"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Filter, ChevronDown, ChevronUp, User, Clock, Search } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import toast from "react-hot-toast";

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const entityFilters = [
  { value: "", label: "All Entities" },
  { value: "order", label: "Order" },
  { value: "product", label: "Product" },
  { value: "customer", label: "Customer" },
  { value: "settings", label: "Settings" },
  { value: "coupon", label: "Coupon" },
  { value: "banner", label: "Banner" },
  { value: "staff", label: "Staff" },
  { value: "supplier", label: "Supplier" },
  { value: "review", label: "Review" },
  { value: "inventory", label: "Inventory" },
];

const actionColors: Record<string, string> = {
  order_status_changed: "bg-blue-50 text-blue-700",
  order_updated: "bg-blue-50 text-blue-700",
  fulfillment_assigned: "bg-purple-50 text-purple-700",
  product_created: "bg-green-50 text-green-700",
  product_updated: "bg-amber-50 text-amber-700",
  product_deleted: "bg-red-50 text-red-700",
  coupon_created: "bg-green-50 text-green-700",
  coupon_updated: "bg-amber-50 text-amber-700",
  coupon_deleted: "bg-red-50 text-red-700",
  banner_created: "bg-green-50 text-green-700",
  banner_updated: "bg-amber-50 text-amber-700",
  banner_deleted: "bg-red-50 text-red-700",
  staff_created: "bg-green-50 text-green-700",
  staff_updated: "bg-amber-50 text-amber-700",
  staff_deleted: "bg-red-50 text-red-700",
  customer_updated: "bg-amber-50 text-amber-700",
  customer_deleted: "bg-red-50 text-red-700",
  review_approved: "bg-green-50 text-green-700",
  review_rejected: "bg-red-50 text-red-700",
  stock_updated: "bg-amber-50 text-amber-700",
  supplier_created: "bg-green-50 text-green-700",
  supplier_updated: "bg-amber-50 text-amber-700",
  supplier_deactivated: "bg-red-50 text-red-700",
  refund_processed: "bg-purple-50 text-purple-700",
  settings_updated: "bg-gray-50 text-gray-700",
};

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailsPanel({ details }: { details: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(details).filter(([k]) => k !== "before" && k !== "after");
  const before = details.before as Record<string, unknown> | undefined;
  const after = details.after as Record<string, unknown> | undefined;

  if (entries.length === 0 && !before && !after) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] text-charcoal-muted hover:text-charcoal"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide" : "Show"} details
      </button>
      {expanded && (
        <div className="mt-2 p-3 bg-ivory-dark/30 rounded-lg text-[11px] space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-charcoal-muted capitalize">{key.replace(/_/g, " ")}</span>
              <span className="text-charcoal font-medium">{String(value)}</span>
            </div>
          ))}
          {before && after && (
            <div className="border-t border-ivory-dark/40 pt-2 mt-2">
              <p className="text-[10px] uppercase tracking-wider text-charcoal-muted mb-1">Changes</p>
              {Object.keys(after).map((key) => {
                if (key === "updated_at") return null;
                const oldVal = before[key];
                const newVal = after[key];
                if (oldVal === newVal) return null;
                return (
                  <div key={key} className="flex items-center gap-2 py-0.5">
                    <span className="text-charcoal-muted capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-red-500 line-through">{JSON.stringify(oldVal)}</span>
                    <span className="text-green-600">{JSON.stringify(newVal)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actions, setActions] = useState<string[]>([]);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/activity?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
        if (data.actions) setActions(data.actions);
      } else {
        toast.error("Failed to load activity logs");
      }
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Audit Trail</span>
        <h1 className="text-2xl font-serif font-bold text-charcoal mt-1">Activity Log</h1>
        <p className="text-[13px] text-charcoal-muted mt-0.5">Track all admin actions with before/after details</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-charcoal-muted">
          <Filter className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-wider font-medium">Filters:</span>
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
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="text-[13px] border border-ivory-dark/60 rounded-lg px-3 py-1.5 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/10"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-charcoal-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search actions..."
              className="text-[13px] border border-ivory-dark/60 rounded-lg pl-8 pr-3 py-1.5 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-charcoal/10 w-48"
            />
          </div>
          <button onClick={handleSearch} className="px-3 py-1.5 text-[12px] bg-charcoal text-white rounded-lg hover:bg-charcoal/90">
            Search
          </button>
        </div>
        <span className="text-[12px] text-charcoal-muted ml-auto">{total} total entries</span>
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] text-charcoal-muted uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium">Staff Member</th>
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
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {timeAgo(log.created_at)}
                    </div>
                    <p className="text-[10px] text-charcoal-muted/60 mt-0.5">{formatDate(log.created_at)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${actionColors[log.action] || "bg-gray-50 text-gray-700"}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gold/10 text-gold-dark capitalize">
                      {log.entity}
                    </span>
                    {log.entity_id && (
                      <p className="text-[10px] text-charcoal-muted mt-0.5">#{log.entity_id.slice(0, 8)}…</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-charcoal-muted max-w-[250px]">
                    <DetailsPanel details={log.details || {}} />
                    {Object.keys(log.details || {}).length === 0 && "—"}
                  </td>
                  <td className="px-5 py-3 text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-charcoal-muted" />
                      <span className="text-charcoal font-medium">{log.user_name}</span>
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
