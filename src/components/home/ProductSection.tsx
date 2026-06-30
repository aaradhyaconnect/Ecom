import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getProductsByFlag } from "@/lib/supabase/queries";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface ProductSectionProps {
  title: string;
  subtitle: string;
  category?: string;
  flag?: "is_new" | "is_best_seller" | "is_sale";
  viewAllHref: string;
}

export async function ProductSection({
  title,
  subtitle,
  category,
  flag,
  viewAllHref,
}: ProductSectionProps) {
  let products: Product[];
  try {
    if (flag) {
      products = await getProductsByFlag({ flag, limit: 4 });
    } else if (category) {
      const result = await getProducts({ category, limit: 4 });
      products = result.products;
    } else {
      products = [];
    }
  } catch {
    products = [];
  }

  if (products.length === 0) return null;

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-14">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-[1px] w-8 bg-gold/50" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
                Curated Selection
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
              {title}
            </h2>
            <p className="text-sm text-charcoal-muted mt-2">{subtitle}</p>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal-muted hover:text-charcoal transition-colors duration-300 group"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 stagger-children">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-12 text-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal border-b border-charcoal/20 pb-1 hover:border-charcoal transition-colors duration-300"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
