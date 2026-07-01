"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { getInitials } from "@/lib/utils/format";
import type { User as UserType } from "@/types";

export function AdminHeader({ user }: { user: UserType }) {
  const router = useRouter();
  const supabase = createClient();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push("/admin/login");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-ivory-dark bg-ivory/95 backdrop-blur lg:left-64">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="lg:hidden">
          <span className="text-lg font-serif font-bold tracking-[0.15em]">HAINJU</span>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <button
            className="relative p-2 text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-ivory-dark">
            <div className="h-8 w-8 bg-ivory-dark flex items-center justify-center text-xs font-semibold text-charcoal-muted">
              {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none text-charcoal">{user?.name || "Admin"}</p>
              <p className="text-xs text-charcoal-muted mt-0.5">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
