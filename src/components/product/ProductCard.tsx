"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
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
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3">
          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1">
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
              "absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110",
              inWishlist ? "text-red-500" : "text-gray-600"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className="h-4 w-4"
              fill={inWishlist ? "currentColor" : "none"}
            />
          </button>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-medium uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <Link href={`/product/${product.slug}`} className="block">
        <h3 className="text-sm font-medium text-gray-900 truncate group-hover:underline">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 capitalize">{product.category.replace("-", " ")}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
