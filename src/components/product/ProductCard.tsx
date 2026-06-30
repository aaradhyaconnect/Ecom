"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useCartStore } from "@/lib/store/cart";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIES } from "@/lib/constants/categories";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

function parseColors(colors: Product["colors"]): { name: string; hex: string }[] {
  if (Array.isArray(colors)) return colors;
  if (typeof colors === "string") {
    try { return JSON.parse(colors); } catch { return []; }
  }
  return [];
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const { isInWishlist, toggleItem } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const inWishlist = isInWishlist(product.id);
  const [hovered, setHovered] = useState(false);
  const colors = parseColors(product.colors);

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.sizes.length > 0 && colors.length > 0) {
      addItem(product, 1, product.sizes[0], colors[0].name);
    }
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
        <div className="relative aspect-[3/4] overflow-hidden bg-ivory-dark mb-4">
          {displayImage && (
            <img
              src={displayImage}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.is_new && <Badge variant="new">New</Badge>}
            {product.is_sale && discount > 0 && (
              <Badge variant="sale">-{discount}%</Badge>
            )}
            {product.is_best_seller && !product.is_sale && (
              <Badge variant="best">Best Seller</Badge>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleItem(product);
            }}
            className={cn(
              "absolute top-3 right-3 p-2.5 rounded-full bg-ivory/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-110 z-10",
              inWishlist
                ? "opacity-100 text-rose-400"
                : "opacity-0 group-hover:opacity-100 text-charcoal-muted hover:text-rose-400"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className="h-4 w-4"
              fill={inWishlist ? "currentColor" : "none"}
            />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-charcoal/95 backdrop-blur-sm text-ivory text-xs font-semibold uppercase tracking-[0.15em] py-3 flex items-center justify-center gap-2.5 hover:bg-charcoal transition-colors duration-300"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Quick Add
            </button>
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="text-ivory text-[11px] font-semibold uppercase tracking-[0.25em] bg-charcoal/50 px-5 py-2 border border-ivory/10">
                Out of Stock
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
        <h3 className="text-sm font-medium text-charcoal truncate group-hover:text-gold-dark transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-[11px] text-charcoal-muted mt-1 capitalize tracking-wide">
          {categoryMap[product.category] || product.category.replace(/-/g, " ")}
        </p>

        {colors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {colors.slice(0, 5).map((color) => (
              <span
                key={color.name}
                className="w-3.5 h-3.5 rounded-full border border-charcoal/10 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[10px] text-charcoal-muted">
                +{colors.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-2">
          <span className="text-base font-bold text-charcoal">{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="text-xs text-charcoal-muted/50 line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
          {product.compare_price && (
            <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-sm">
              SAVE {discount}%
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
