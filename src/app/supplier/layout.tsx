"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Package, LayoutDashboard, LogOut } from "lucide-react";

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/set-session", { method: "DELETE" });
    window.location.href = "/supplier/login";
  };

  const nav = [
    { href: "/supplier/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/supplier/products", label: "My Products", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-ivory-dark/60 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/supplier/dashboard" className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wider">SUPPLIER PORTAL</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith(item.href)
                    ? "text-charcoal font-medium"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-charcoal-muted hover:text-charcoal flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
