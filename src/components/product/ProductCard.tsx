"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useWishlistStore } from "@/lib/store/wishlist";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const { isInWishlist, toggleItem } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <div className="group relative animate-in slide-up">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-ivory-dark mb-4">
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
            />
          )}

          <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/5 transition-colors duration-500" />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
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
              "absolute top-3 right-3 p-2.5 rounded-full bg-ivory/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-110 opacity-0 group-hover:opacity-100",
              inWishlist ? "text-rose-400" : "text-charcoal-muted hover:text-rose-400"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className="h-3.5 w-3.5"
              fill={inWishlist ? "currentColor" : "none"}
            />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button className="w-full bg-charcoal text-ivory text-xs font-medium uppercase tracking-wider py-2.5 flex items-center justify-center gap-2 hover:bg-charcoal-light transition-colors">
              <ShoppingBag className="h-3.5 w-3.5" />
              Quick Add
            </button>
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-charcoal/50 flex items-center justify-center">
              <span className="text-ivory text-xs font-medium uppercase tracking-[0.2em]">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <Link href={`/product/${product.slug}`} className="block">
        <h3 className="text-sm font-medium text-charcoal truncate group-hover:text-gold-dark transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-xs text-charcoal-muted mt-1 capitalize tracking-wide">{product.category.replace("-", " ")}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-semibold text-charcoal">{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="text-xs text-charcoal-muted/60 line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
