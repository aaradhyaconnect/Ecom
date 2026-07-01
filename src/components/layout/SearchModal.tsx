"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowUpRight } from "lucide-react";
import { useUIStore } from "@/lib/store/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/utils/format";

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

  const handleClose = () => {
    setQuery("");
    setResults([]);
    closeSearch();
  };

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const displayResults = debouncedQuery && debouncedQuery.length >= 2 ? results : [];

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return;
    }

    (async () => {
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
    })();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="fixed top-0 left-0 right-0 bg-ivory shadow-2xl animate-in slide-in-from-top">
        <div className="max-w-2xl mx-auto p-6">
          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-muted/50" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for products..."
              className="w-full pl-12 pr-12 py-4 text-lg bg-transparent border-b-2 border-ivory-dark focus:border-gold/60 focus:ring-0 outline-none text-charcoal placeholder:text-charcoal-muted/40 transition-colors duration-300"
            />
            <button
              onClick={handleClose}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-ivory-dark  transition-colors"
            >
              <X className="h-4 w-4 text-charcoal-muted" />
            </button>
          </div>

          {isLoading && (
            <div className="py-8 text-center text-charcoal-muted text-sm">Searching...</div>
          )}

          {displayResults.length > 0 && (
            <div className="py-4 space-y-1 max-h-96 overflow-auto">
              {displayResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={closeSearch}
                  className="flex items-center gap-4 p-3 hover:bg-ivory-dark/50 transition-colors group"
                >
                  <div className="w-16 h-20 overflow-hidden bg-ivory-dark flex-shrink-0 relative">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Image
                        src="/placeholder.svg"
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {product.name}
                    </p>
                    <p className="text-[10px] text-charcoal-muted uppercase tracking-wider capitalize mt-0.5">
                      {product.category.replace("-", " ")}
                    </p>
                    <p className="text-sm font-bold mt-1">{formatPrice(product.price)}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-charcoal-muted/30 group-hover:text-gold-dark transition-colors" />
                </Link>
              ))}
            </div>
          )}

          {debouncedQuery && !isLoading && displayResults.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-charcoal-muted text-sm">
                No products found for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="text-charcoal-muted/50 text-[10px] mt-1 uppercase tracking-wider">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
