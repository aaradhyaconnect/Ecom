"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
}

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`);
        const data = await res.json();
        setResults(data.data?.products || []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeSearch();
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSearch} />
      <div className="fixed top-0 left-0 right-0 bg-white shadow-2xl animate-in slide-in-from-top">
        <div className="max-w-2xl mx-auto p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for products..."
              className="w-full pl-12 pr-12 py-4 text-lg border-0 border-b-2 border-gray-200 focus:border-black focus:ring-0 outline-none"
            />
            <button
              onClick={closeSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoading && (
            <div className="py-8 text-center text-gray-500">Searching...</div>
          )}

          {results.length > 0 && (
            <div className="py-4 space-y-2 max-h-96 overflow-auto">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={closeSearch}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="w-16 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{product.category}</p>
                    <p className="text-sm font-semibold mt-1">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {debouncedQuery && !isLoading && results.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No products found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
