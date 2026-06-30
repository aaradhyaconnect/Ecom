"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductGrid } from "./ProductGrid";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-semibold text-charcoal mb-4 uppercase tracking-[0.2em]">Price Range</h3>
        <div className="space-y-1">
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
                  "block w-full text-left text-sm py-2 px-4 transition-all duration-200",
                  active
                    ? "bg-charcoal text-ivory font-medium"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-charcoal mb-4 uppercase tracking-[0.2em]">Size</h3>
        <div className="flex flex-wrap gap-2">
          {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
            <button
              key={size}
              onClick={() => handleSizeFilter(size)}
              className={cn(
                "w-10 h-10 rounded-full text-sm font-medium border transition-all duration-200",
                currentSizes.includes(size)
                  ? "bg-charcoal text-ivory border-charcoal"
                  : "border-ivory-dark text-charcoal-muted hover:border-charcoal"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-charcoal mb-4 uppercase tracking-[0.2em]">Color</h3>
        <div className="flex flex-wrap gap-2">
          {["Black", "White", "Red", "Blue", "Green", "Pink", "Beige", "Navy"].map(
            (color) => (
              <button
                key={color}
                onClick={() => handleColorFilter(color)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                  currentColors.includes(color)
                    ? "bg-charcoal text-ivory border-charcoal"
                    : "border-ivory-dark text-charcoal-muted hover:border-charcoal"
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
          className="text-charcoal-muted hover:text-charcoal underline underline-offset-4"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">
            {category === "new-arrivals" ? "New In" : category === "sale" ? "Offers" : "Collection"}
          </span>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-charcoal mt-1 capitalize">
            {categoryTitle}
          </h1>
          <p className="text-sm text-charcoal-muted mt-1.5">
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
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2.5 border border-ivory-dark rounded-sm hover:bg-ivory-dark transition-colors"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-charcoal" />
          </button>
        </div>
      </div>

      <div className="flex gap-10">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-28">
            <div className="border border-ivory-dark/50 p-6">
              {filterSidebarContent}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <ProductGrid
            products={initialProducts.products}
            columns={3}
          />

          {initialProducts.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
              >
                Previous
              </Button>

              {pageNumbers.map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-charcoal-muted">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "w-9 h-9 rounded-sm text-sm font-medium transition-all duration-200",
                      page === currentPage
                        ? "bg-charcoal text-ivory"
                        : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark"
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
                className="border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-all duration-400 lg:hidden",
          mobileFilterOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-charcoal/20 backdrop-blur-sm transition-opacity duration-400",
            mobileFilterOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileFilterOpen(false)}
        />
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 w-80 max-w-full bg-ivory shadow-2xl transition-transform duration-400",
            mobileFilterOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-5 border-b border-ivory-dark">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-charcoal">Filters</h3>
            <button onClick={() => setMobileFilterOpen(false)} className="p-1 hover:bg-ivory-dark rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto h-[calc(100%-60px)]">
            {filterSidebarContent}
          </div>
        </div>
      </div>
    </div>
  );
}
