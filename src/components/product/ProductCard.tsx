"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { CATEGORIES } from "@/lib/constants/categories";
import type { Product } from "@/types";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
  preload?: boolean;
}

const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

function parseColors(colors: Product["colors"]): { name: string; hex: string }[] {
  if (Array.isArray(colors)) return colors;
  if (typeof colors === "string") {
    try { return JSON.parse(colors); } catch { return []; }
  }
  return [];
}

export function ProductCard({ product, preload }: ProductCardProps) {
  const { isInWishlist, toggleItem } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const inWishlist = isInWishlist(product.id);
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const colors = parseColors(product.colors);

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (product.sizes.length > 0 && colors.length > 0) {
      addItem(product, 1, product.sizes[0], colors[0].name);
    } else if (product.sizes.length > 0) {
      addItem(product, 1, product.sizes[0], "default");
    } else {
      addItem(product, 1, "default", colors[0]?.name || "default");
    }
    toast.success("Added to cart");
  };

  const displayImage =
    hovered && product.images?.[1] ? product.images[1] : product.images?.[0];

  return (
    <div
      className="group relative animate-in slide-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-beige mb-4 rounded-lg shadow-sm group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
          {displayImage && !imgError ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              preload={preload}
              className="object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <Image
              src="/placeholder.svg"
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          )}

          {/* Shine overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_new && (
              <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] bg-charcoal text-ivory rounded-sm shadow-md">
                New
              </span>
            )}
            {product.is_sale && discount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] bg-rose-500 text-white rounded-sm shadow-md">
                -{discount}%
              </span>
            )}
            {product.is_best_seller && !product.is_sale && (
              <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] bg-gold text-charcoal rounded-sm shadow-md">
                Best Seller
              </span>
            )}
            {product.is_prebook && (
              <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] bg-amber-500 text-white rounded-sm shadow-md">
                Pre-Book
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem(product);
            }}
            className={cn(
              "absolute top-3 right-3 p-2.5 backdrop-blur-sm rounded-full transition-all duration-300 z-10 shadow-sm",
              inWishlist
                ? "opacity-100 text-rose-400 bg-white/95 scale-100"
                : "opacity-0 group-hover:opacity-100 text-charcoal-muted bg-white/95 hover:text-rose-400 scale-90 group-hover:scale-100"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className="h-4 w-4"
              fill={inWishlist ? "currentColor" : "none"}
            />
          </button>

          {/* Quick Add button */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] z-10">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-charcoal/95 backdrop-blur-sm text-ivory text-[11px] font-semibold uppercase tracking-[0.18em] py-3.5 flex items-center justify-center gap-2.5 hover:bg-gold hover:text-charcoal transition-colors duration-300 rounded-sm shadow-lg"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Quick Add
            </button>
          </div>

          {/* Sold Out overlay */}
          {product.stock <= 0 && !product.is_prebook && (
            <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-lg">
              <span className="text-ivory text-[10px] font-semibold uppercase tracking-[0.3em] bg-charcoal/50 px-6 py-2.5 border border-ivory/10 rounded-sm">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      <Link href={`/product/${product.slug}`} className="block">
        <div className="flex items-center gap-1 mb-1.5">
          {Array.from({ length: 5 }).map((_, si) => (
            <Star
              key={si}
              className={cn(
                "h-3 w-3",
                si < Math.floor(product.rating)
                  ? "text-gold fill-gold"
                  : "text-ivory-dark fill-ivory-dark"
              )}
            />
          ))}
          <span className="text-[10px] text-charcoal-muted ml-1">
            ({product.review_count})
          </span>
        </div>
        <h3 className="text-[13px] font-medium text-charcoal truncate group-hover:text-gold-dark transition-colors duration-500">
          {product.name}
        </h3>
        <p className="text-[10px] text-charcoal-muted mt-0.5 capitalize tracking-[0.12em] uppercase">
          {categoryMap[product.category] || product.category.replace(/-/g, " ")}
        </p>

        {colors.length > 0 && (
          <div className="flex items-center gap-2 mt-2.5">
            {colors.slice(0, 5).map((color) => (
              <span
                key={color.name}
                className="w-3.5 h-3.5 rounded-full border border-charcoal/10 flex-shrink-0 ring-1 ring-charcoal/5 hover:ring-gold/50 hover:scale-125 transition-all duration-200 cursor-pointer"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[10px] text-charcoal-muted font-medium">
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[15px] font-bold text-charcoal tracking-tight">
            {formatPrice(product.price)}
          </span>
          {product.compare_price && (
            <span className="text-[11px] text-charcoal-muted line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
          {product.compare_price && (
            <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-sm ml-auto">
              SAVE {discount}%
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
