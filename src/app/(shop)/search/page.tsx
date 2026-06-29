import { getProducts } from "@/lib/supabase/queries";
import { ProductListingClient } from "@/components/product/ProductListingClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;

  const query = (params.q as string) || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const sort = (params.sort as string) || "newest";
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const sizes = (params.sizes as string)?.split(",").filter(Boolean);
  const colors = (params.colors as string)?.split(",").filter(Boolean);

  const result = await getProducts({
    search: query || undefined,
    sort,
    page,
    limit,
    minPrice,
    maxPrice,
    sizes,
    colors,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">
          {query ? (
            <>
              Search results for &ldquo;<span className="text-gray-500">{query}</span>&rdquo;
            </>
          ) : (
            "All Products"
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {result.total} {result.total === 1 ? "product" : "products"} found
        </p>
      </div>

      <ProductListingClient category="all" initialProducts={result} />
    </div>
  );
}
