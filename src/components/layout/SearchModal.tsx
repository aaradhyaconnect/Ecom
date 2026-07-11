"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowUpRight, Clock, TrendingUp, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
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

const SEARCH_HISTORY_KEY = "arconstyle-search-history";
const MAX_HISTORY = 8;

const TRENDING_SEARCHES = [
  "Saree", "Kurti", "Lehenga", "Necklace Set", "Anarkali", "Jhumka", "Salwar Suit", "Ring",
];

function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(term: string) {
  const history = getSearchHistory().filter((h) => h.toLowerCase() !== term.toLowerCase());
  history.unshift(term);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function removeFromHistory(term: string) {
  const history = getSearchHistory().filter((h) => h !== term);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory());
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    closeSearch();
  };

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isSearchOpen]);

  useEffect(() => {
    closeSearch();
  }, [pathname, closeSearch]);

  const displayResults = debouncedQuery && debouncedQuery.length >= 2 ? results : [];

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.data?.products || []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  const handleSearch = (term: string) => {
    if (term.trim()) {
      saveToHistory(term.trim());
      setHistory(getSearchHistory());
    }
  };

  const handleHistoryClick = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  const handleRemoveHistory = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeFromHistory(term);
    setHistory(getSearchHistory());
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  if (!isSearchOpen) return null;

  const showDefault = !debouncedQuery || debouncedQuery.length < 2;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="fixed top-0 left-0 right-0 bg-ivory shadow-2xl animate-in slide-in-from-top">
        <div className="max-w-2xl mx-auto p-6">
          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for products..."
              className="w-full pl-12 pr-12 py-4 text-lg bg-transparent border-b-2 border-ivory-dark focus:border-gold/60 focus:ring-0 outline-none text-charcoal placeholder:text-charcoal-muted transition-colors duration-300"
            />
            <button
              onClick={handleClose}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-ivory-dark transition-colors"
              aria-label="Close search"
            >
              <X className="h-4 w-4 text-charcoal-muted" />
            </button>
          </div>

          {/* Default state: History + Trending */}
          {showDefault && (
            <div className="py-4 space-y-6">
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-charcoal-muted" />
                      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-charcoal-muted">Recent Searches</span>
                    </div>
                    <button
                      onClick={handleClearHistory}
                      className="text-[10px] text-charcoal-muted hover:text-rose-500 uppercase tracking-wider transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {history.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleHistoryClick(term)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-charcoal hover:bg-ivory-dark/50 transition-colors group"
                      >
                        <Clock className="h-3.5 w-3.5 text-charcoal-muted/50 flex-shrink-0" />
                        <span className="flex-1 text-left">{term}</span>
                        <span
                          onClick={(e) => handleRemoveHistory(e, term)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-3.5 w-3.5 text-gold-dark" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-charcoal-muted">Trending Now</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleHistoryClick(term)}
                      className="px-3 py-1.5 text-[11px] font-medium border border-ivory-dark text-charcoal-muted hover:border-charcoal/20 hover:text-charcoal transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="py-8 text-center text-charcoal-muted text-sm">Searching...</div>
          )}

          {/* Search Results */}
          {displayResults.length > 0 && (
            <div className="py-4 space-y-1 max-h-96 overflow-auto">
              {displayResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={() => {
                    handleSearch(query);
                    closeSearch();
                  }}
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
                  <ArrowUpRight className="h-4 w-4 text-charcoal-muted group-hover:text-gold-dark transition-colors" />
                </Link>
              ))}
            </div>
          )}

          {/* No results */}
          {debouncedQuery && !isLoading && displayResults.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-charcoal-muted text-sm">
                No products found for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="text-charcoal-muted text-[11px] mt-1 uppercase tracking-wider">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
