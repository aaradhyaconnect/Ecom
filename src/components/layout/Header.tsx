"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useUIStore } from "@/lib/store/ui";
import { useAuthStore } from "@/lib/store/auth";
import { NAV_LINKS, SITE } from "@/lib/constants/site";
import { CartDrawer } from "./CartDrawer";
import { SearchModal } from "./SearchModal";

export function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, openCart, openSearch } = useUIStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";
  const isDark = isScrolled || !isHome;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
          isDark
            ? "bg-ivory/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        )}
      >
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[1px] transition-opacity duration-500",
          isDark ? "opacity-100" : "opacity-0",
          "bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        )} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button
              className="lg:hidden p-2 -ml-2 relative z-50"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={cn(
                  "block h-[1.5px] w-full transition-all duration-300",
                  isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : isDark ? "bg-charcoal" : "bg-white"
                )} />
                <span className={cn(
                  "block h-[1.5px] w-full transition-all duration-300",
                  isMobileMenuOpen ? "opacity-0" : isDark ? "bg-charcoal" : "bg-white"
                )} />
                <span className={cn(
                  "block h-[1.5px] w-full transition-all duration-300",
                  isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : isDark ? "bg-charcoal" : "bg-white"
                )} />
              </div>
            </button>

            <Link
              href="/"
              className={cn(
                "text-xl lg:text-2xl font-bold tracking-[0.35em] transition-colors font-serif",
                isDark ? "text-charcoal" : "text-white"
              )}
            >
              {SITE.name}
            </Link>

            <nav className="hidden lg:flex items-center space-x-10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative text-[11px] font-medium uppercase tracking-[0.15em] transition-colors duration-300 group py-1",
                    isDark ? "text-charcoal-muted hover:text-charcoal" : "text-white/70 hover:text-white"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute bottom-0 left-0 right-0 h-[1.5px] transition-all duration-300",
                    pathname === link.href ? "scale-x-100 bg-gold" : "scale-x-0 group-hover:scale-x-100 bg-gold"
                  )} />
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-0.5 sm:space-x-1">
              <button
                onClick={openSearch}
                className={cn(
                  "p-2.5 hover:scale-110 transition-all duration-200 rounded-full",
                  isDark ? "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50" : "text-white/70 hover:text-white"
                )}
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>

              <Link
                href={user ? "/wishlist" : "/login"}
                className={cn(
                  "hidden sm:block p-2.5 hover:scale-110 transition-all duration-200 rounded-full relative",
                  isDark ? "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50" : "text-white/70 hover:text-white"
                )}
                aria-label="Wishlist"
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-charcoal text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center scale-in">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href={user ? "/profile" : "/login"}
                className={cn(
                  "hidden sm:block p-2.5 hover:scale-110 transition-all duration-200 rounded-full",
                  isDark ? "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50" : "text-white/70 hover:text-white"
                )}
                aria-label="Account"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>

              <button
                onClick={openCart}
                className={cn(
                  "p-2.5 hover:scale-110 transition-all duration-200 rounded-full relative",
                  isDark ? "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50" : "text-white/70 hover:text-white"
                )}
                aria-label="Cart"
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-charcoal text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center scale-in">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "lg:hidden fixed inset-0 z-50 transition-all duration-400",
            isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          <div
            className={cn(
              "absolute inset-0 bg-charcoal/20 backdrop-blur-sm transition-opacity duration-400",
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={closeMobileMenu}
          />
          <div
            className={cn(
              "absolute top-0 right-0 bottom-0 w-72 bg-ivory shadow-2xl transition-transform duration-400",
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <nav className="flex flex-col p-8 pt-14 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "text-[13px] font-medium text-charcoal-muted hover:text-charcoal transition-colors py-3.5 border-b border-ivory-dark/50 uppercase tracking-[0.1em]",
                    pathname === link.href && "text-charcoal"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-8 space-y-5">
                <Link
                  href={user ? "/profile" : "/login"}
                  onClick={closeMobileMenu}
                  className="text-[13px] font-medium text-charcoal-muted hover:text-charcoal transition-colors flex items-center gap-3 uppercase tracking-[0.1em]"
                >
                  <User className="h-4 w-4" />
                  {user ? "My Account" : "Sign In"}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={closeMobileMenu}
                  className="text-[13px] font-medium text-charcoal-muted hover:text-charcoal transition-colors flex items-center gap-3 uppercase tracking-[0.1em]"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="bg-gold text-charcoal text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-auto">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <CartDrawer />
      <SearchModal />
    </>
  );
}
