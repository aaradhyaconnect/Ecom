"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils/format";
import type { User as UserType } from "@/types";

export function AdminHeader({ user }: { user: UserType }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b bg-white/95 backdrop-blur lg:left-64">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="lg:hidden">
          <span className="text-lg font-bold">HAINJU ADMIN</span>
        </div>
        <div className="hidden lg:block" />
        <div className="flex items-center gap-3">
          <button
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
              {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
