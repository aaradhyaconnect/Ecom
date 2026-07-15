"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAdminPermissions } from "./admin-permissions-provider";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Warehouse,
  FolderTree,
  ClipboardList,
  Truck,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permissionModule: "orders", permissionAction: "view" },
  { href: "/admin/shipping", label: "Shipping", icon: Truck, permissionModule: "orders", permissionAction: "view" },
  { href: "/admin/products", label: "Products", icon: Package, permissionModule: "products", permissionAction: "view" },
  { href: "/admin/inventory", label: "Stock", icon: Warehouse, permissionModule: "inventory", permissionAction: "view" },
  { href: "/admin/customers", label: "Customers", icon: Users, permissionModule: "customers", permissionAction: "view" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, permissionModule: "categories", permissionAction: "view" },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList, permissionModule: "reports", permissionAction: "view" },
  { href: "/admin/coupons", label: "Coupons", icon: Tag, permissionModule: "marketing", permissionAction: "view" },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const { hasPerm, loading } = useAdminPermissions();

  const visibleItems = loading
    ? []
    : navItems.filter(
        (item) =>
          !item.permissionModule ||
          hasPerm(item.permissionModule, item.permissionAction!)
      );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ivory-dark/60 bg-white/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around py-2 px-1">
        {visibleItems.map((item) => {
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
                  ? "text-charcoal"
                  : "text-charcoal-muted hover:text-charcoal"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-colors",
                isActive && "bg-charcoal/10"
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
