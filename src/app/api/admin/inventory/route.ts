import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import type { Product } from "@/types";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const filter = url.searchParams.get("filter") || "all"; // all, low, out
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select("id, name, slug, category, stock, price, images, is_new, is_best_seller, is_sale", { count: "exact" })
      .order("stock", { ascending: true });

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(`name.ilike.%${escaped}%`);
    }

    if (filter === "low") {
      query = query.gt("stock", 0).lte("stock", 5);
    } else if (filter === "out") {
      query = query.eq("stock", 0);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Product[],
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const { id, stock, updates } = body;

    if (updates && Array.isArray(updates)) {
      const results = await Promise.all(
        updates.map(async (item: { id: string; stock: number }) => {
          if (typeof item.stock !== "number" || item.stock < 0 || !Number.isFinite(item.stock)) {
            return { id: item.id, success: false, error: "Invalid stock value" };
          }
          const { error } = await supabase
            .from("products")
            .update({ stock: Math.floor(item.stock), updated_at: new Date().toISOString() })
            .eq("id", item.id);
          return { id: item.id, success: !error, error: error?.message };
        })
      );
      return NextResponse.json({ success: true, data: results });
    }

    if (id !== undefined && stock !== undefined) {
      const stockNum = Math.max(0, Math.floor(Number(stock)));
      const { data, error } = await supabase
        .from("products")
        .update({ stock: stockNum, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: data as Product });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
