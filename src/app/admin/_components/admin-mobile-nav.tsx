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
  Warehouse,
  FolderTree,
  ClipboardList,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Stock", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ivory-dark/60 dark:border-white/10 bg-white/95 dark:bg-charcoal-light/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around py-2 px-1">
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
                "flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[9px] font-medium transition-all duration-200 rounded-lg min-w-[40px]",
                isActive
                  ? "text-charcoal dark:text-gold-light"
                  : "text-charcoal-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-colors",
                isActive && "bg-charcoal/10 dark:bg-gold/20"
              )}>
                <item.icon className={cn("h-4.5 w-4.5", isActive && "stroke-[2px]")} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
