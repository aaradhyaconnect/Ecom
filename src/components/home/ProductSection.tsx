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
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">{title}</h2>
            <p className="text-gray-500 mt-2">{subtitle}</p>
          </div>
          <Link
            href={viewAllHref}
            className="hidden sm:flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
