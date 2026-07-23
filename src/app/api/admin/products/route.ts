import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";
import { logActivity } from "@/lib/utils/activity";
import type { Product } from "@/types";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("products", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const status = url.searchParams.get("status") || "";
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
    if (status) {
      query = query.eq("status", status);
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
    const auth = await requirePermission("products", "create");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const slug = slugify(body.name);

    const existing = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
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
      stock: Math.max(0, Math.floor(Number(body.stock) || 0)),
      sku: body.sku || null,
      barcode: body.barcode || null,
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      status: body.status || "published",
      cost_price: body.cost_price != null ? Number(body.cost_price) : null,
      stock_alert: body.stock_alert != null ? Math.max(0, Number(body.stock_alert)) : 5,
      video_url: body.video_url || null,
      sale_percent: body.sale_percent != null ? Number(body.sale_percent) : null,
      is_prebook: body.is_prebook || false,
      prebook_amount: body.prebook_amount != null ? Number(body.prebook_amount) : null,
      prebook_note: body.prebook_note || null,
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

    await logActivity({
      action: "product_created",
      entity: "product",
      entityId: data.id,
      userId: auth.user?.id,
      after: { name: data.name, price: data.price, stock: data.stock, category: data.category },
    });

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
    const auth = await requirePermission("products", "edit");
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
      "is_new", "is_best_seller", "is_sale", "stock",
      "sku", "barcode", "seo_title", "seo_description", "status",
      "cost_price", "stock_alert", "video_url", "sale_percent",
      "is_prebook", "prebook_amount", "prebook_note",
    ] as const;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in rawUpdates) updates[key] = rawUpdates[key];
    }

    if (updates.name) {
      const newSlug = slugify(updates.name as string);
      const { data: slugCollision } = await supabase
        .from("products")
        .select("id")
        .eq("slug", newSlug)
        .neq("id", id)
        .maybeSingle();
      updates.slug = slugCollision ? `${newSlug}-${Date.now()}` : newSlug;
    }
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.compare_price !== undefined) updates.compare_price = updates.compare_price ? Number(updates.compare_price) : null;
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.prebook_amount !== undefined) updates.prebook_amount = updates.prebook_amount != null ? Number(updates.prebook_amount) : null;

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

    await logActivity({
      action: "product_updated",
      entity: "product",
      entityId: id,
      userId: auth.user?.id,
      after: { name: data.name, ...updates },
      details: { changed_fields: Object.keys(updates).filter((k) => k !== "updated_at") },
    });

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
    const auth = await requirePermission("products", "delete");
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

    const { count: orderCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .contains("items", [{ product_id: id }]);

    if (orderCount && orderCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: product has ${orderCount} associated order(s). Consider deactivating instead.` },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await logActivity({
      action: "product_deleted",
      entity: "product",
      entityId: id,
      userId: auth.user?.id,
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
