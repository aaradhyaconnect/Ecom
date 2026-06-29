import { getProducts } from "@/lib/supabase/queries";
import { ProductListingClient } from "@/components/product/ProductListingClient";
import type { ProductCategory } from "@/types";

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

  const result = await getProducts({
    category: categoryParam as ProductCategory | undefined,
    search,
    sort,
    page,
    limit,
    minPrice,
    maxPrice,
    sizes,
    colors,
  });

  return (
    <ProductListingClient category={category} initialProducts={result} />
  );
}
