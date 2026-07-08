"use client";

import { LogOut, User, Bell, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import { getInitials } from "@/lib/utils/format";
import { useState, useRef, useEffect, useMemo } from "react";
import type { User as UserType } from "@/types";

export function AdminHeader({ user }: { user: UserType }) {
  const supabase = useMemo(() => createClient(), []);
  const logout = useAuthStore((s) => s.logout);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-ivory-dark/60 bg-white/95 backdrop-blur-sm lg:left-64">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile logo */}
        <div className="lg:hidden">
          <span className="text-lg font-serif font-bold tracking-[0.12em]">HAINJU</span>
          <span className="text-[9px] tracking-[0.25em] text-charcoal-muted ml-1 uppercase">Admin</span>
        </div>
        <div className="hidden lg:block" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative p-2.5 text-charcoal-muted hover:bg-ivory-dark/40 hover:text-charcoal transition-colors rounded-lg"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 hover:bg-ivory-dark/40 transition-colors rounded-lg"
            >
              <div className="h-8 w-8 bg-charcoal text-ivory rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[13px] font-medium leading-none text-charcoal">{user?.name || "Admin"}</p>
                <p className="text-[11px] text-charcoal-muted mt-0.5">{user?.email}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-charcoal-muted hidden sm:block" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-ivory-dark/60 shadow-lg py-1 rounded-lg z-50">
                <div className="px-4 py-3 border-b border-ivory-dark/60">
                  <p className="text-sm font-medium text-charcoal">{user?.name || "Admin"}</p>
                  <p className="text-xs text-charcoal-muted mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-charcoal-muted hover:bg-ivory-dark/40 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
