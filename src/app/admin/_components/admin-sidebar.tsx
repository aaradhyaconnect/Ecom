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
  ExternalLink,
  MessageSquare,
  Star,
  Mail,
  Settings,
  FileText,
  HelpCircle,
  Layout,
  Navigation,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/homepage", label: "Homepage", icon: Layout },
  { href: "/admin/navigation", label: "Navigation", icon: Navigation },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const bottomItems = [
  { href: "/", label: "View Store", icon: ExternalLink },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-ivory-dark/60 dark:border-white/10 bg-white dark:bg-charcoal-light lg:flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-ivory-dark/60 dark:border-white/10 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-charcoal flex items-center justify-center">
            <span className="text-ivory text-xs font-bold tracking-wider">H</span>
          </div>
          <div>
            <span className="text-lg font-serif font-bold tracking-[0.12em] text-charcoal dark:text-white">Arcon Style</span>
            <span className="text-[10px] font-sans tracking-[0.25em] text-charcoal-muted dark:text-white/60 ml-1.5 uppercase">Admin</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-200 rounded-lg group",
                isActive
                  ? "bg-charcoal text-ivory dark:bg-gold/20 dark:text-gold-light shadow-sm"
                  : "text-charcoal-muted dark:text-white/60 hover:bg-ivory-dark/40 dark:hover:bg-white/5 hover:text-charcoal dark:hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-ivory dark:text-gold-light" : "text-charcoal-muted dark:text-white/60 group-hover:text-charcoal dark:group-hover:text-white"
              )} />
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-ivory-dark/60 dark:border-white/10">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-charcoal-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white hover:bg-ivory-dark/40 dark:hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            <ExternalLink className="h-3 w-3 ml-auto opacity-40" />
          </Link>
        ))}
      </div>
    </aside>
  );
}
