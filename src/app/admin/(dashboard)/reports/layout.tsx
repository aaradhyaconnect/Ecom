"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  BarChart3,
  Package,
  Boxes,
  Users,
} from "lucide-react";

const tabs = [
  { label: "Sales", href: "/admin/reports/sales", icon: BarChart3 },
  { label: "Products", href: "/admin/reports/products", icon: Package },
  { label: "Inventory", href: "/admin/reports/inventory", icon: Boxes },
  { label: "Customers", href: "/admin/reports/customers", icon: Users },
];

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">
          Reports
        </p>
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          Reports
        </h1>
      </div>

      <div className="border-b border-ivory-dark/60">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                  isActive
                    ? "border-gold text-gold-dark"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
