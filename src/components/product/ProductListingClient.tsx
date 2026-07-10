"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown, Star, Search } from "lucide-react";
import { ProductGrid } from "./ProductGrid";
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

const DISCOUNT_RANGES = [
  { label: "10% or more", min: 10 },
  { label: "25% or more", min: 25 },
  { label: "50% or more", min: 50 },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Products",
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
  const [brandSearch, setBrandSearch] = useState("");

  const currentSort = searchParams.get("sort") || "newest";
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const currentSizes = searchParams.get("sizes")?.split(",").filter(Boolean) || [];
  const currentColors = searchParams.get("colors")?.split(",").filter(Boolean) || [];
  const currentInStock = searchParams.get("inStock") === "true";
  const currentOnSale = searchParams.get("onSale") === "true";
  const currentMinRating = searchParams.get("minRating");
  const currentMinDiscount = searchParams.get("minDiscount");
  const currentMaterials = searchParams.get("materials")?.split(",").filter(Boolean) || [];
  const currentTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

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
    setMobileFilterOpen(false);
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
    setMobileFilterOpen(false);
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
    setMobileFilterOpen(false);
    router.push(
      buildHref({
        colors: colors.length > 0 ? colors.join(",") : undefined,
        page: "1",
      })
    );
  };

  const handleInStockFilter = () => {
    setMobileFilterOpen(false);
    router.push(
      buildHref({
        inStock: currentInStock ? undefined : "true",
        page: "1",
      })
    );
  };

  const handleOnSaleFilter = () => {
    setMobileFilterOpen(false);
    router.push(
      buildHref({
        onSale: currentOnSale ? undefined : "true",
        page: "1",
      })
    );
  };

  const handleRatingFilter = (rating: number) => {
    setMobileFilterOpen(false);
    router.push(
      buildHref({
        minRating: currentMinRating === String(rating) ? undefined : String(rating),
        page: "1",
      })
    );
  };

  const handleDiscountFilter = (minDiscount: number) => {
    setMobileFilterOpen(false);
    router.push(
      buildHref({
        minDiscount: currentMinDiscount === String(minDiscount) ? undefined : String(minDiscount),
        page: "1",
      })
    );
  };

  const handleMaterialFilter = (material: string) => {
    const materials = currentMaterials.includes(material)
      ? currentMaterials.filter((m) => m !== material)
      : [...currentMaterials, material];
    setMobileFilterOpen(false);
    router.push(
      buildHref({
        materials: materials.length > 0 ? materials.join(",") : undefined,
        page: "1",
      })
    );
  };

  const handleTagFilter = (tag: string) => {
    const tags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    setMobileFilterOpen(false);
    router.push(
      buildHref({
        tags: tags.length > 0 ? tags.join(",") : undefined,
        page: "1",
      })
    );
  };

  const clearFilters = () => {
    setMobileFilterOpen(false);
    router.push(`/products/${category}`);
  };

  const hasActiveFilters =
    !!currentMinPrice ||
    !!currentMaxPrice ||
    currentSizes.length > 0 ||
    currentColors.length > 0 ||
    currentInStock ||
    currentOnSale ||
    !!currentMinRating ||
    !!currentMinDiscount ||
    currentMaterials.length > 0 ||
    currentTags.length > 0;

  const activeFilterCount = [
    !!currentMinPrice || !!currentMaxPrice,
    currentSizes.length > 0,
    currentColors.length > 0,
    currentInStock,
    currentOnSale,
    !!currentMinRating,
    !!currentMinDiscount,
    currentMaterials.length > 0,
    currentTags.length > 0,
  ].filter(Boolean).length;

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
  }, [initialProducts, currentPage]);

  const categoryTitle = CATEGORY_LABELS[category] || category.replace(/-/g, " ");

  const availableColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    initialProducts.products.forEach((p) => {
      let cols = p.colors;
      if (typeof cols === "string") {
        try { cols = JSON.parse(cols); } catch { cols = []; }
      }
      if (Array.isArray(cols)) {
        cols.forEach((c: { name: string; hex: string }) => {
          if (!colorMap.has(c.name)) colorMap.set(c.name, c.hex);
        });
      }
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [initialProducts.products]);

  const availableMaterials = useMemo(() => {
    const matSet = new Set<string>();
    initialProducts.products.forEach((p) => {
      if (p.material) matSet.add(p.material);
    });
    return Array.from(matSet).sort();
  }, [initialProducts.products]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    initialProducts.products.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet).sort();
  }, [initialProducts.products]);

  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>();
    initialProducts.products.forEach((p) => {
      const brandTag = p.tags?.find((t) => t.toLowerCase().startsWith("brand:"));
      if (brandTag) brandSet.add(brandTag.replace("brand:", "").trim());
    });
    return Array.from(brandSet).sort();
  }, [initialProducts.products]);

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return availableBrands;
    return availableBrands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [availableBrands, brandSearch]);

  const filterSidebarContent = (
    <div className="space-y-8">
      {/* Rating */}
      <div>
        <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Rating</h3>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingFilter(rating)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm w-full transition-all duration-300",
                currentMinRating === String(rating)
                  ? "bg-charcoal text-ivory font-medium"
                  : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50"
              )}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < rating ? "fill-gold text-gold" : "fill-ivory-dark text-ivory-dark"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs">& up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Price Range</h3>
        <div className="space-y-0.5">
          {PRICE_RANGES.map((range) => {
            const active =
              range.max === undefined
                ? currentMinPrice === String(range.min) && !currentMaxPrice
                : currentMinPrice === String(range.min) &&
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
                  "block w-full text-left text-sm py-2.5 px-4 transition-all duration-200",
                  active
                    ? "bg-charcoal text-ivory font-medium"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discount */}
      <div>
        <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Discount</h3>
        <div className="space-y-0.5">
          {DISCOUNT_RANGES.map((range) => {
            const active = currentMinDiscount === String(range.min);
            return (
              <button
                key={range.label}
                onClick={() =>
                  active ? clearFilters() : handleDiscountFilter(range.min)
                }
                className={cn(
                  "block w-full text-left text-sm py-2.5 px-4 transition-all duration-200",
                  active
                    ? "bg-charcoal text-ivory font-medium"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Size</h3>
        <div className="flex flex-wrap gap-2">
          {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
            <button
              key={size}
              onClick={() => handleSizeFilter(size)}
              className={cn(
                "w-10 h-10 text-xs font-medium border transition-all duration-300",
                currentSizes.includes(size)
                  ? "bg-charcoal text-ivory border-charcoal"
                  : "border-ivory-dark text-charcoal-muted hover:border-charcoal/30"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Color</h3>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorFilter(color.name)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border transition-all duration-300",
                currentColors.includes(color.name)
                  ? "bg-charcoal text-ivory border-charcoal"
                  : "border-ivory-dark text-charcoal-muted hover:border-charcoal/30"
              )}
            >
              <span
                className="w-3 h-3 rounded-full border border-charcoal/10 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              {color.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand (via tags) */}
      {availableBrands.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Brand</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-charcoal-muted" />
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Search brands..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-ivory-dark bg-transparent text-charcoal placeholder:text-charcoal-muted/50 focus:border-gold/60 focus:ring-0 outline-none transition-colors"
            />
          </div>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {filteredBrands.map((brand) => {
              const tag = `brand:${brand}`;
              const active = currentTags.includes(tag);
              return (
                <button
                  key={brand}
                  onClick={() => handleTagFilter(tag)}
                  className={cn(
                    "block w-full text-left text-sm py-2 px-4 transition-all duration-200 truncate",
                    active
                      ? "bg-charcoal text-ivory font-medium"
                      : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50"
                  )}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Material */}
      {availableMaterials.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Material</h3>
          <div className="space-y-0.5">
            {availableMaterials.map((material) => (
              <button
                key={material}
                onClick={() => handleMaterialFilter(material)}
                className={cn(
                  "block w-full text-left text-sm py-2.5 px-4 transition-all duration-200",
                  currentMaterials.includes(material)
                    ? "bg-charcoal text-ivory font-medium"
                    : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50"
                )}
              >
                {material}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags / Occasion */}
      {availableTags.filter((t) => !t.toLowerCase().startsWith("brand:")).length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags
              .filter((t) => !t.toLowerCase().startsWith("brand:"))
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border transition-all duration-300",
                    currentTags.includes(tag)
                      ? "bg-charcoal text-ivory border-charcoal"
                      : "border-ivory-dark text-charcoal-muted hover:border-charcoal/30"
                  )}
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <h3 className="text-[10px] font-semibold text-charcoal mb-4 uppercase tracking-[0.25em]">Availability</h3>
        <button
          onClick={handleInStockFilter}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm w-full transition-all duration-300",
            currentInStock
              ? "bg-charcoal text-ivory font-medium"
              : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50"
          )}
        >
          <span className={cn(
            "w-4 h-4 border flex items-center justify-center text-[10px]",
            currentInStock ? "bg-charcoal border-charcoal text-ivory" : "border-ivory-dark"
          )}>
            {currentInStock && "✓"}
          </span>
          In Stock Only
        </button>
        <button
          onClick={handleOnSaleFilter}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm w-full transition-all duration-300",
            currentOnSale
              ? "bg-charcoal text-ivory font-medium"
              : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark/50"
          )}
        >
          <span className={cn(
            "w-4 h-4 border flex items-center justify-center text-[10px]",
            currentOnSale ? "bg-charcoal border-charcoal text-ivory" : "border-ivory-dark"
          )}>
            {currentOnSale && "✓"}
          </span>
          On Sale
        </button>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-[10px] text-charcoal-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white uppercase tracking-[0.15em] underline underline-offset-4 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-[1px] w-6 bg-gold/50" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
              {category === "new-arrivals" ? "New In" : category === "sale" ? "Offers" : "Collection"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal capitalize">
            {categoryTitle}
          </h1>
          <p className="text-sm text-charcoal-muted mt-1.5">
            {initialProducts.total}{" "}
            {initialProducts.total === 1 ? "product" : "products"}
            {activeFilterCount > 0 && (
              <span className="text-gold ml-2">
                ({activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => handleSort(e.target.value)}
              className="appearance-none bg-transparent border border-ivory-dark text-sm text-charcoal-muted py-2.5 pl-4 pr-10 rounded-none focus:border-gold/60 focus:ring-0 outline-none cursor-pointer transition-colors duration-300"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-charcoal-muted pointer-events-none" />
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2.5 border border-ivory-dark hover:border-charcoal/20 transition-colors relative"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-charcoal-muted" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gold text-charcoal text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-10">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-28">
            <div className="border border-ivory-dark/60 p-6 rounded-lg card-hover">
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
            <div className="flex items-center justify-center gap-2 mt-14">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(
                  "px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] border transition-all duration-300",
                  currentPage <= 1
                    ? "border-ivory-dark text-charcoal-muted cursor-not-allowed"
                    : "border-ivory-dark text-charcoal-muted hover:border-charcoal hover:text-charcoal"
                )}
              >
                Previous
              </button>

              {pageNumbers.map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-charcoal-muted text-sm">
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "w-10 h-10 text-xs font-medium transition-all duration-300",
                      page === currentPage
                        ? "bg-charcoal text-ivory"
                        : "text-charcoal-muted hover:text-charcoal hover:bg-ivory-dark"
                    )}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                disabled={currentPage >= initialProducts.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(
                  "px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] border transition-all duration-300",
                  currentPage >= initialProducts.totalPages
                    ? "border-ivory-dark text-charcoal-muted cursor-not-allowed"
                    : "border-ivory-dark text-charcoal-muted hover:border-charcoal hover:text-charcoal"
                )}
              >
                Next
              </button>
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
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal">
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 text-gold">({activeFilterCount})</span>
              )}
            </h3>
            <button onClick={() => setMobileFilterOpen(false)} className="p-2 hover:bg-ivory-dark transition-colors">
              <X className="h-4 w-4 text-charcoal-muted" />
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
