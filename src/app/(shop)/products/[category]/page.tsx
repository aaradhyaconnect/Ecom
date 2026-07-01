import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/constants/categories";
import { getProducts } from "@/lib/supabase/queries";
import { ProductListingClient } from "@/components/product/ProductListingClient";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);
  const name = cat?.name || category.replace(/-/g, " ");

  return {
    title: `${name} - Shop Online`,
    description: `Browse our ${name} collection at HAINJU. Premium designer clothing and artificial jewellery.`,
    alternates: {
      canonical: `/products/${category}`,
    },
    openGraph: {
      title: `${name} | HAINJU`,
      description: `Browse our ${name} collection at HAINJU.`,
      url: `/products/${category}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const filters = await searchParams;

  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const sort = (filters.sort as string) || "newest";
  const search = filters.search as string | undefined;
  const minPrice = filters.minPrice ? Number(filters.minPrice) : undefined;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : undefined;
  const sizes = (filters.sizes as string)?.split(",").filter(Boolean);
  const colors = (filters.colors as string)?.split(",").filter(Boolean);
  const inStock = filters.inStock === "true";
  const onSale = filters.onSale === "true";

  const categoryParam = category === "all" ? undefined : category;

  let result: { products: Product[]; total: number; page: number; limit: number; totalPages: number } = {
    products: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  };
  try {
    result = await getProducts({
      category: categoryParam,
      search,
      sort,
      page,
      limit,
      minPrice,
      maxPrice,
      sizes,
      colors,
      inStock,
      onSale,
    });
  } catch {
    // Products may fail to load — render with empty results
  }

  return (
    <ProductListingClient category={category} initialProducts={result} />
  );
}
