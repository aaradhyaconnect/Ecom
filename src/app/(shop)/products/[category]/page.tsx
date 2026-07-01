import { getProducts } from "@/lib/supabase/queries";
import { ProductListingClient } from "@/components/product/ProductListingClient";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
    });
  } catch {
    // Products may fail to load — render with empty results
  }

  return (
    <ProductListingClient category={category} initialProducts={result} />
  );
}
