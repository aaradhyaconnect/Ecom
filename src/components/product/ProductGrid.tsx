import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, isLoading, columns = 4 }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 ${columns >= 3 ? "md:grid-cols-3" : ""} ${columns >= 4 ? "lg:grid-cols-4" : ""} gap-3 md:gap-5`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-[1px] bg-gold/30 mx-auto mb-6" />
        <p className="text-charcoal text-lg font-serif font-medium">No products found</p>
        <p className="text-charcoal-muted text-sm mt-2">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 ${columns >= 3 ? "md:grid-cols-3" : ""} ${columns >= 4 ? "lg:grid-cols-4" : ""} gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12 stagger-children`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
