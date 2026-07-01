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
        <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">
          {query ? "Search" : "Collection"}
        </span>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-charcoal mt-1">
          {query ? (
            <>
              Results for &ldquo;<span className="text-charcoal-muted">{query}</span>&rdquo;
            </>
          ) : (
            "All Products"
          )}
        </h1>
        <p className="text-sm text-charcoal-muted mt-1">
          {result.total} {result.total === 1 ? "product" : "products"} found
        </p>
      </div>

      <ProductListingClient category="all" initialProducts={result} />
    </div>
  );
}
