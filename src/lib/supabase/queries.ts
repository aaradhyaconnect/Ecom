import type { Product, Banner, Coupon, Order } from "@/types";
import { createServerSupabase } from "./server";

export async function getProducts({
  category,
  search,
  sort,
  page = 1,
  limit = 20,
  minPrice,
  maxPrice,
  sizes,
  colors,
}: {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
}) {
  const supabase = await createServerSupabase();
  let query = supabase.from("products").select("*", { count: "exact" });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`
    );
  }

  if (minPrice !== undefined) {
    query = query.gte("price", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("price", maxPrice);
  }
  if (sizes && sizes.length > 0) {
    query = query.overlaps("sizes", sizes);
  }
  if (colors && colors.length > 0) {
    query = query.overlaps("colors", colors);
  }

  if (sort) {
    switch (sort) {
      case "price-asc":
        query = query.order("price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "rating":
        query = query.order("rating", { ascending: false });
        break;
      case "popular":
        query = query.order("review_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    products: data as Product[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getProduct(slug: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as Product;
}

export async function getProductById(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Product;
}

export async function getFeaturedProducts() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or("is_new.eq.true,is_best_seller.eq.true,is_sale.eq.true")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) throw error;
  return data as Product[];
}

export async function getBanners() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("order", { ascending: true });

  if (error) throw error;
  return data as Banner[];
}

export async function getCoupon(code: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as Coupon;
}

export async function getUserOrders(userId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Order[];
}

export async function getUserOrder(orderId: string, userId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as Order;
}
