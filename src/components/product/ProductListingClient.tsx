"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductGrid } from "./ProductGrid";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types";

interface ProductListingClientProps {
  category: string;
  initialProducts: {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

const PRICE_RANGES = [
  { label: "Under ₹1,000", min: 0, max: 1000 },
  { label: "₹1,000 - ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 - ₹5,000", min: 2500, max: 5000 },
  { label: "Above ₹5,000", min: 5000, max: undefined },
];

const CATEGORY_LABELS: Record<string, string> = {
  "women-clothing": "Women's Clothing",
  "artificial-jewellery": "Artificial Jewellery",
  "new-arrivals": "New Arrivals",
  "best-sellers": "Best Sellers",
  sale: "Sale",
};

export function ProductListingClient({
  category,
  initialProducts,
}: ProductListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "newest";
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const currentSizes = searchParams.get("sizes")?.split(",").filter(Boolean) || [];
  const currentColors = searchParams.get("colors")?.split(",").filter(Boolean) || [];

  const buildHref = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      return `/products/${category}${qs ? `?${qs}` : ""}`;
    },
    [searchParams, category]
  );

  const handleSort = (value: string) => {
    router.push(buildHref({ sort: value, page: "1" }));
  };

  const handlePageChange = (page: number) => {
    router.push(buildHref({ page: String(page) }));
  };

  const handlePriceFilter = (min?: number, max?: number) => {
    router.push(
      buildHref({
        minPrice: min !== undefined ? String(min) : undefined,
        maxPrice: max !== undefined ? String(max) : undefined,
        page: "1",
      })
    );
  };

  const handleSizeFilter = (size: string) => {
    const sizes = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];
    router.push(
      buildHref({
        sizes: sizes.length > 0 ? sizes.join(",") : undefined,
        page: "1",
      })
    );
  };

  const handleColorFilter = (color: string) => {
    const colors = currentColors.includes(color)
      ? currentColors.filter((c) => c !== color)
      : [...currentColors, color];
    router.push(
      buildHref({
        colors: colors.length > 0 ? colors.join(",") : undefined,
        page: "1",
      })
    );
  };

  const clearFilters = () => {
    router.push(`/products/${category}`);
  };

  const hasActiveFilters =
    !!currentMinPrice ||
    !!currentMaxPrice ||
    currentSizes.length > 0 ||
    currentColors.length > 0;

  const pageNumbers = useMemo(() => {
    const { totalPages } = initialProducts;
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [initialProducts.totalPages, currentPage]);

  const categoryTitle = CATEGORY_LABELS[category] || category.replace(/-/g, " ");

  const filterSidebarContent = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
          Price Range
        </h3>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => {
            const active =
              currentMinPrice === String(range.min) &&
              currentMaxPrice === String(range.max);
            return (
              <button
                key={range.label}
                onClick={() =>
                  active
                    ? clearFilters()
                    : handlePriceFilter(range.min, range.max)
                }
                className={cn(
                  "block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors",
                  active
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
          Size
        </h3>
        <div className="flex flex-wrap gap-2">
          {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
            <button
              key={size}
              onClick={() => handleSizeFilter(size)}
              className={cn(
                "w-10 h-10 rounded-full text-sm font-medium border transition-colors",
                currentSizes.includes(size)
                  ? "bg-black text-white border-black"
                  : "border-gray-300 text-gray-600 hover:border-gray-900"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
          Color
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Black", "White", "Red", "Blue", "Green", "Pink", "Beige", "Navy"].map(
            (color) => (
              <button
                key={color}
                onClick={() => handleColorFilter(color)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  currentColors.includes(color)
                    ? "bg-black text-white border-black"
                    : "border-gray-300 text-gray-600 hover:border-gray-900"
                )}
              >
                {color}
              </button>
            )
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-red-500 hover:text-red-600"
        >
          <X className="h-4 w-4 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold capitalize">
            {categoryTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {initialProducts.total}{" "}
            {initialProducts.total === 1 ? "product" : "products"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            options={SORT_OPTIONS}
            value={currentSort}
            onChange={(e) => handleSort(e.target.value)}
            className="w-40"
          />

          <button
            className="lg:hidden p-2 border border-gray-300 rounded-lg"
            aria-label="Toggle filters"
            id="mobile-filter-toggle"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            {filterSidebarContent}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <ProductGrid
            products={initialProducts.products}
            columns={3}
          />

          {initialProducts.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>

              {pageNumbers.map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                      page === currentPage
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {page}
                  </button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= initialProducts.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
