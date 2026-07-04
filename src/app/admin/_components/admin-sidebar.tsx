"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Image,
  BarChart3,
  Warehouse,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomItems = [
  { href: "/", label: "View Store", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-ivory-dark/80 bg-ivory lg:flex flex-col">
      <div className="flex h-16 items-center border-b border-ivory-dark/80 px-6">
        <Link href="/admin" className="text-xl font-serif font-bold tracking-[0.15em] text-charcoal">
          HAINJU<span className="text-charcoal-muted/40 font-sans text-[10px] tracking-[0.3em] ml-2 uppercase">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-300 rounded-lg",
                isActive
                  ? "bg-charcoal text-ivory"
                  : "text-charcoal-muted hover:bg-ivory-dark/50 hover:text-charcoal"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ivory-dark/80">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-charcoal-muted/60 hover:text-charcoal transition-colors duration-300"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
