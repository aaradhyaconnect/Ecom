import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  viewMode?: "grid" | "list";
}

function ProductListItem({ product }: { product: Product }) {
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="flex gap-4 p-4 bg-ivory border border-ivory-dark/60 hover:border-charcoal/20 transition-colors group"
    >
      <div className="relative w-32 h-40 flex-shrink-0 bg-charcoal/5 overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="128px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Image src="/placeholder.svg" alt={product.name} fill sizes="128px" className="object-cover" />
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && <Badge variant="new">New</Badge>}
          {product.is_sale && discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <p className="text-[10px] text-charcoal-muted uppercase tracking-[0.2em] mb-1">
            {product.category.replace(/-/g, " ")}
          </p>
          <h3 className="text-sm font-serif font-bold text-charcoal group-hover:text-gold-dark transition-colors truncate">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-charcoal-muted mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-charcoal">{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="text-xs text-charcoal-muted line-through">{formatPrice(product.compare_price)}</span>
          )}
          {product.compare_price && (
            <span className="text-[10px] font-semibold text-rose-500">Save {discount}%</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, isLoading, columns = 4, viewMode = "grid" }: ProductGridProps) {
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

  if (viewMode === "list") {
    return (
      <div className="space-y-3 stagger-children">
        {products.map((product) => (
          <ProductListItem key={product.id} product={product} />
        ))}
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
