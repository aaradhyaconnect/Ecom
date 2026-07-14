"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Package,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useUIStore } from "@/lib/store/ui";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/hooks/useHydrated";
import { NAV_LINKS, SITE } from "@/lib/constants/site";
import { CartDrawer } from "./CartDrawer";
import { SearchModal } from "./SearchModal";
import { AnnouncementBar } from "./AnnouncementBar";

export function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { toggleMobileMenu, isMobileMenuOpen, openCart, openSearch } = useUIStore();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mounted = useHydrated();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  const isHome = pathname === "/";
  const isSolid = isScrolled || !isHome;

  async function handleLogout() {
    useAuthStore.setState({ user: null, loading: false });
    await fetch("/api/auth/set-session", { method: "DELETE", headers: { "Content-Type": "application/json" } }).catch(() => {});
    window.location.href = "/";
  }

  const textColor = isSolid ? "text-charcoal" : "text-white";
  const textMuted = isSolid ? "text-charcoal-muted" : "text-white/70";
  const hamburgerColor = isSolid ? "bg-charcoal" : "bg-white";

  return (
    <>
      <AnnouncementBar />
      <header
        className={cn(
          "fixed left-0 right-0 z-40 transition-all duration-500",
          isSolid
            ? "bg-white/95 backdrop-blur-lg shadow-sm py-2"
            : "bg-gradient-to-b from-black/40 via-black/20 to-transparent backdrop-blur-sm py-4"
        )}
        style={{ top: "var(--header-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 lg:h-16">
            <button
              className="lg:hidden p-2 -ml-2 relative z-50"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={cn(
                  "block h-[1.5px] w-full transition-all duration-300",
                  isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : "",
                  hamburgerColor
                )} />
                <span className={cn(
                  "block h-[1.5px] w-full transition-all duration-300",
                  isMobileMenuOpen ? "opacity-0" : "",
                  hamburgerColor
                )} />
                <span className={cn(
                  "block h-[1.5px] w-full transition-all duration-300",
                  isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : "",
                  hamburgerColor
                )} />
              </div>
            </button>

            <Link
              href="/"
              className={cn(
                "text-xl lg:text-2xl font-bold tracking-[0.35em] transition-colors font-serif",
                textColor
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
                    textMuted
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute bottom-0 left-0 right-0 h-[1px] transition-all duration-300",
                    pathname === link.href ? "scale-x-100 bg-gold" : "scale-x-0 group-hover:scale-x-100 bg-gold"
                  )} />
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-0.5 sm:space-x-1">
              <button
                onClick={openSearch}
                className={cn(
                  "p-2.5 hover:scale-110 transition-all duration-200 rounded-lg",
                  textMuted
                )}
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>

              <Link
                href={mounted && user ? "/account/wishlist" : "/login"}
                className={cn(
                  "hidden sm:block p-2.5 hover:scale-110 transition-all duration-200 relative rounded-lg",
                  textMuted
                )}
                aria-label="Wishlist"
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-charcoal text-[9px] font-bold w-4 h-4 flex items-center justify-center scale-in">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* User icon with hover dropdown */}
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => {
                    if (!user) {
                      window.location.href = "/login";
                    } else {
                      setShowUserMenu(!showUserMenu);
                    }
                  }}
                  onMouseEnter={() => mounted && user && setShowUserMenu(true)}
                  className={cn(
                    "p-2.5 hover:scale-110 transition-all duration-200 rounded-lg flex items-center gap-0.5",
                    textMuted
                  )}
                  aria-label="Account"
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {mounted && user && (
                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", showUserMenu && "rotate-180")} />
                  )}
                </button>

                {mounted && user && showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-56 bg-white border border-ivory-dark shadow-lg py-2 z-50"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-ivory-dark">
                      <p className="text-xs text-charcoal-muted uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-medium text-charcoal truncate mt-0.5">{user.email || user.phone || "User"}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-ivory-dark transition-colors"
                    >
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-ivory-dark transition-colors"
                    >
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-ivory-dark transition-colors"
                    >
                      <Heart className="h-4 w-4" /> Wishlist
                    </Link>
                    <div className="border-t border-ivory-dark mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 w-full transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile: simple link */}
              <Link
                href={mounted && user ? "/account" : "/login"}
                className={cn(
                  "sm:hidden p-2.5 hover:scale-110 transition-all duration-200 rounded-lg",
                  textMuted
                )}
                aria-label="Account"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </Link>

              <button
                onClick={openCart}
                className={cn(
                  "p-2.5 hover:scale-110 transition-all duration-200 relative rounded-lg",
                  textMuted
                )}
                aria-label="Cart"
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-charcoal text-[9px] font-bold w-4 h-4 flex items-center justify-center scale-in">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer />
      <SearchModal />
    </>
  );
}
