import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProducts } from "@/lib/supabase/queries";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface ProductSectionProps {
  title: string;
  subtitle: string;
  category: string;
  viewAllHref: string;
}

export async function ProductSection({
  title,
  subtitle,
  category,
  viewAllHref,
}: ProductSectionProps) {
  let products: Product[];
  try {
    const result = await getProducts({ category, limit: 4 });
    products = result.products;
  } catch {
    products = [];
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Curated Selection</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-charcoal mt-2">{title}</h2>
            <div className="w-12 h-[1px] bg-gold/40 mt-3" />
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-charcoal-muted hover:text-charcoal transition-colors"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 stagger-children">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 text-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-charcoal underline underline-offset-4"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
