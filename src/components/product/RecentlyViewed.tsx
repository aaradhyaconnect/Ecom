"use client";

import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductCard } from "./ProductCard";

export function RecentlyViewed() {
  const { products } = useRecentlyViewed();

  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-[1px] w-8 bg-gold/50" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
            Recently Viewed
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
