"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/hooks/useHydrated";

export function MobileNavigation() {
  const pathname = usePathname();
  const cartItemsCount = useCartStore((s) => s.items.length);
  const wishlistItemsCount = useWishlistStore((s) => s.items.length);
  const user = useAuthStore((s) => s.user);
  const mounted = useHydrated();

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Browse",
      icon: Compass,
      href: "/search",
      active: pathname.startsWith("/search") || pathname.startsWith("/products"),
    },
    {
      label: "Wishlist",
      icon: Heart,
      href: "/account/wishlist",
      active: pathname === "/account/wishlist",
      badge: mounted ? wishlistItemsCount : 0,
    },
    {
      label: "Cart",
      icon: ShoppingBag,
      href: "/cart",
      active: pathname === "/cart",
      badge: mounted ? cartItemsCount : 0,
    },
    {
      label: "Profile",
      icon: User,
      href: mounted && user ? "/account" : "/login",
      active: pathname === "/account" || pathname === "/login" || pathname === "/signup",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-ivory/95 backdrop-blur-md border-t border-ivory-dark/50 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] lg:hidden transition-transform duration-300">
      <div className="flex items-center justify-between h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative text-center group",
                item.active ? "text-gold" : "text-charcoal-muted hover:text-charcoal"
              )}
            >
              <div className="relative p-1">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-300 group-active:scale-110",
                    item.active ? "stroke-[2px]" : "stroke-[1.5px]"
                  )}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-gold text-charcoal text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center scale-in">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-wider uppercase font-medium mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
