"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Permissions, StaffRole } from "@/types";

interface AdminMeData {
  staffRole: StaffRole;
  permissions: Permissions;
  user: { id: string; email: string | undefined };
  staffUser: {
    id: string;
    display_name: string;
    username: string;
    role: string;
  } | null;
}

interface AdminPermsCtx {
  loading: boolean;
  staffRole: StaffRole;
  permissions: Permissions;
  user: AdminMeData["user"] | null;
  staffUser: AdminMeData["staffUser"] | null;
  hasPerm: (module: string, action: string) => boolean;
  refresh: () => void;
}

const AdminPermissionsContext = createContext<AdminPermsCtx>({
  loading: true,
  staffRole: "super_admin",
  permissions: {} as Permissions,
  user: null,
  staffUser: null,
  hasPerm: () => true,
  refresh: () => {},
});

export function useAdminPermissions() {
  return useContext(AdminPermissionsContext);
}

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminMeData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchPermissions() {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPermissions();
  }, []);

  const value: AdminPermsCtx = {
    loading,
    staffRole: data?.staffRole ?? "super_admin",
    permissions: data?.permissions ?? ({} as Permissions),
    user: data?.user ?? null,
    staffUser: data?.staffUser ?? null,
    hasPerm: (module: string, action: string) => {
      if (!data) return false;
      if (data.staffRole === "super_admin") return true;
      return data.permissions[module as keyof Permissions]?.[action as keyof Permissions[keyof Permissions]] ?? false;
    },
    refresh: fetchPermissions,
  };

  return (
    <AdminPermissionsContext.Provider value={value}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}
