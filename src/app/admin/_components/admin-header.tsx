"use client";

import { LogOut, User, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { getInitials } from "@/lib/utils/format";
import type { User as UserType } from "@/types";

export function AdminHeader({ user }: { user: UserType }) {
  const supabase = createClient();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await fetch("/api/auth/set-session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
    logout();
    window.location.replace("/admin/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-ivory-dark/80 bg-ivory/95 backdrop-blur-sm lg:left-64">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="lg:hidden">
          <span className="text-lg font-serif font-bold tracking-[0.15em]">HAINJU</span>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <button
            className="relative p-2 text-charcoal-muted/60 hover:bg-ivory-dark/50 hover:text-charcoal transition-colors rounded-lg"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-ivory-dark/80">
            <div className="h-8 w-8 bg-ivory-dark/80 rounded-full flex items-center justify-center text-[11px] font-semibold text-charcoal-muted">
              {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-medium leading-none text-charcoal">{user?.name || "Admin"}</p>
              <p className="text-[11px] text-charcoal-muted/60 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-charcoal-muted/60 hover:bg-ivory-dark/50 hover:text-charcoal transition-colors rounded-lg"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
