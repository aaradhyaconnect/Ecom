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
  FolderTree,
  UserCog,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, group: "main" },
  { href: "/admin/products", label: "Products", icon: Package, group: "catalog" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, group: "catalog" },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse, group: "catalog" },
  { href: "/admin/customers", label: "Customers", icon: Users, group: "people" },
  { href: "/admin/users", label: "Staff Users", icon: UserCog, group: "people" },
  { href: "/admin/coupons", label: "Coupons", icon: Tag, group: "marketing" },
  { href: "/admin/banners", label: "Banners", icon: Image, group: "marketing" },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail, group: "marketing" },
  { href: "/admin/pages", label: "Pages", icon: FileText, group: "content" },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle, group: "content" },
  { href: "/admin/homepage", label: "Homepage", icon: Layout, group: "content" },
  { href: "/admin/navigation", label: "Navigation", icon: Navigation, group: "content" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, group: "content" },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare, group: "content" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, group: "insights" },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList, group: "insights" },
  { href: "/admin/settings", label: "Settings", icon: Settings, group: "system" },
];

const groupLabels: Record<string, string> = {
  main: "",
  catalog: "Catalog",
  people: "People",
  marketing: "Marketing",
  content: "Content",
  insights: "Insights",
  system: "System",
};

const bottomItems = [
  { href: "/", label: "View Store", icon: ExternalLink },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const groupedItems = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const group = item.group || "main";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-ivory-dark/60 bg-white lg:flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-ivory-dark/60 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-charcoal flex items-center justify-center">
            <span className="text-ivory text-xs font-bold tracking-wider">A</span>
          </div>
          <div>
            <span className="text-lg font-serif font-bold tracking-[0.12em] text-charcoal">Arcon Style</span>
            <span className="text-[10px] font-sans tracking-[0.25em] text-charcoal-muted ml-1.5 uppercase">Admin</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group}>
            {groupLabels[group] && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal-muted/60">
                {groupLabels[group]}
              </div>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
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
                        ? "bg-charcoal text-ivory shadow-sm"
                        : "text-charcoal-muted hover:bg-ivory-dark/40 hover:text-charcoal"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-ivory" : "text-charcoal-muted group-hover:text-charcoal"
                    )} />
                    {item.label}
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-ivory-dark/60">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/40 transition-all duration-200 rounded-lg"
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
