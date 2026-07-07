import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";
import type { Product } from "@/types";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        `name.ilike.%${escaped}%,description.ilike.%${escaped}%`
      );
    }
    if (category) {
      query = query.eq("category", category);
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

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const slug = slugify(body.name);

    const existing = await supabase
      .rpc("get_product_by_slug", { p_slug: slug })
      .select("id")
      .maybeSingle();

    let finalSlug = slug;
    if (existing.data) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const product = {
      name: body.name,
      slug: finalSlug,
      description: body.description || "",
      category: body.category,
      subcategory: body.subcategory || null,
      price: Number(body.price) || 0,
      compare_price: body.compare_price ? Number(body.compare_price) : null,
      images: body.images || [],
      sizes: body.sizes || [],
      colors: body.colors || [],
      tags: body.tags || [],
      material: body.material || null,
      care_instructions: body.care_instructions || null,
      is_new: body.is_new || false,
      is_best_seller: body.is_best_seller || false,
      is_sale: body.is_sale || false,
      sale_percent: body.sale_percent ? Number(body.sale_percent) : null,
      stock: Math.max(0, Math.floor(Number(body.stock) || 0)),
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data as Product });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const { id, ...rawUpdates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "name", "description", "category", "subcategory", "price", "compare_price",
      "images", "sizes", "colors", "tags", "material", "care_instructions",
      "is_new", "is_best_seller", "is_sale", "sale_percent", "stock",
    ] as const;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in rawUpdates) updates[key] = rawUpdates[key];
    }

    if (updates.name) {
      updates.slug = slugify(updates.name as string);
    }
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.compare_price !== undefined) updates.compare_price = updates.compare_price ? Number(updates.compare_price) : null;
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);

    const { data, error } = await supabase
      .from("products")
      .update(updates)
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
