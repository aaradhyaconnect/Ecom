"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ShoppingBag,
  Heart,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";
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
  const wishlistCount = useCartStore((s) => s.items.length);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          isScrolled || !isHome
            ? "bg-white shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link
              href="/"
              className={cn(
                "text-xl lg:text-2xl font-bold tracking-widest transition-colors",
                isScrolled || !isHome ? "text-black" : "text-white"
              )}
            >
              {SITE.name}
            </Link>

            <nav className="hidden lg:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium uppercase tracking-wider hover:opacity-70 transition-opacity",
                    isScrolled || !isHome ? "text-gray-800" : "text-white",
                    pathname === link.href && "opacity-70"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-3 lg:space-x-4">
              <button
                onClick={openSearch}
                className={cn(
                  "p-2 hover:opacity-70 transition-opacity",
                  isScrolled || !isHome ? "text-gray-800" : "text-white"
                )}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href={user ? "/wishlist" : "/login"}
                className={cn(
                  "hidden sm:block p-2 hover:opacity-70 transition-opacity relative",
                  isScrolled || !isHome ? "text-gray-800" : "text-white"
                )}
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
              </Link>

              <Link
                href={user ? "/profile" : "/login"}
                className={cn(
                  "hidden sm:block p-2 hover:opacity-70 transition-opacity",
                  isScrolled || !isHome ? "text-gray-800" : "text-white"
                )}
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={openCart}
                className={cn(
                  "p-2 hover:opacity-70 transition-opacity relative",
                  isScrolled || !isHome ? "text-gray-800" : "text-white"
                )}
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "lg:hidden fixed inset-0 top-16 bg-white z-50 transition-transform duration-300",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <nav className="flex flex-col p-6 space-y-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="text-lg font-medium text-gray-800 hover:text-black transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-200" />
            <Link
              href={user ? "/profile" : "/login"}
              onClick={closeMobileMenu}
              className="text-lg font-medium text-gray-800 hover:text-black transition-colors flex items-center gap-2"
            >
              <User className="h-5 w-5" />
              {user ? "My Account" : "Sign In"}
            </Link>
            <Link
              href="/wishlist"
              onClick={closeMobileMenu}
              className="text-lg font-medium text-gray-800 hover:text-black transition-colors flex items-center gap-2"
            >
              <Heart className="h-5 w-5" />
              Wishlist
            </Link>
          </nav>
        </div>
      </header>

      <CartDrawer />
      <SearchModal />
    </>
  );
}
