import { getProducts, getProductsByFlag } from "@/lib/supabase/queries";
import { ProductListingClient } from "@/components/product/ProductListingClient";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const FLAG_MAP: Record<string, "is_new" | "is_best_seller" | "is_sale"> = {
  "new-arrivals": "is_new",
  "best-sellers": "is_best_seller",
  "sale": "is_sale",
};

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

  const flag = FLAG_MAP[category];

  let result;
  if (flag) {
    const products = await getProductsByFlag({ flag, limit });
    result = {
      products,
      total: products.length,
      page: 1,
      limit,
      totalPages: 1,
    };
  } else {
    const categoryParam = category === "all" ? undefined : category;
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
  }

  return (
    <ProductListingClient category={category} initialProducts={result} />
  );
}
