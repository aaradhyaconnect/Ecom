"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, User, Activity, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import toast from "react-hot-toast";

interface StaffMember {
  user_id: string;
  user_name: string;
  total_actions: number;
  last_active: string;
  actions_breakdown: Record<string, number>;
  entities_touched: Record<string, number>;
}

export default function StaffActivityPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchStaffActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity?limit=500");
      const data = await res.json();
      if (data.success) {
        const logs = data.data || [];
        const staffMap: Record<string, StaffMember> = {};

        for (const log of logs) {
          const uid = log.user_id || "system";
          if (!staffMap[uid]) {
            staffMap[uid] = {
              user_id: uid,
              user_name: log.user_name || "System",
              total_actions: 0,
              last_active: log.created_at,
              actions_breakdown: {},
              entities_touched: {},
            };
          }
          const member = staffMap[uid];
          member.total_actions++;
          member.actions_breakdown[log.action] = (member.actions_breakdown[log.action] || 0) + 1;
          member.entities_touched[log.entity] = (member.entities_touched[log.entity] || 0) + 1;
          if (new Date(log.created_at) > new Date(member.last_active)) {
            member.last_active = log.created_at;
          }
        }

        const sorted = Object.values(staffMap)
          .filter((s) => s.user_id !== "system")
          .sort((a, b) => b.total_actions - a.total_actions);

        setStaff(sorted);
        setTotal(sorted.reduce((sum, s) => sum + s.total_actions, 0));
      } else {
        toast.error("Failed to load staff activity");
      }
    } catch {
      toast.error("Failed to load staff activity");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStaffActivity(); }, [fetchStaffActivity]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Performance</span>
        <h2 className="text-xl font-serif font-bold text-charcoal mt-1">Staff Activity Report</h2>
        <p className="text-[13px] text-charcoal-muted mt-0.5">Who modified what, when, and how often</p>
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] text-charcoal-muted uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Staff Member</th>
                <th className="px-5 py-3 font-medium">Total Actions</th>
                <th className="px-5 py-3 font-medium">Last Active</th>
                <th className="px-5 py-3 font-medium">Top Actions</th>
                <th className="px-5 py-3 font-medium">Entities Modified</th>
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
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-charcoal-muted">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-charcoal-muted" />
                    No staff activity recorded yet
                  </td>
                </tr>
              ) : staff.map((member) => {
                const topActions = Object.entries(member.actions_breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3);
                const entities = Object.entries(member.entities_touched)
                  .sort(([, a], [, b]) => b - a);

                return (
                  <tr key={member.user_id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-charcoal/5 flex items-center justify-center">
                          <User className="h-4 w-4 text-charcoal-muted" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">{member.user_name}</p>
                          <p className="text-[10px] text-charcoal-muted">#{member.user_id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-lg font-bold text-charcoal">{member.total_actions}</span>
                      <p className="text-[10px] text-charcoal-muted">actions</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-[12px] text-charcoal-muted">
                        <Clock className="h-3 w-3" />
                        {formatDate(member.last_active)}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {topActions.map(([action, count]) => (
                          <span key={action} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-charcoal/5 text-charcoal">
                            {action.replace(/_/g, " ")} ({count})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {entities.slice(0, 4).map(([entity, count]) => (
                          <span key={entity} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gold/10 text-gold-dark capitalize">
                            {entity} ({count})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {staff.length > 0 && (
        <div className="text-[12px] text-charcoal-muted">
          {staff.length} staff member{staff.length !== 1 ? "s" : ""} · {total} total actions recorded
        </div>
      )}
    </div>
  );
}
