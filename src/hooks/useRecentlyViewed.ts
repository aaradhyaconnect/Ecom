"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";

const STORAGE_KEY = "hainju_recently_viewed";
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProducts(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return { products, addProduct };
}

export async function getRecentlyViewed(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .in("id", ids)
      .limit(MAX_ITEMS);

    return (data as Product[]) || [];
  } catch {
    return [];
  }
}
