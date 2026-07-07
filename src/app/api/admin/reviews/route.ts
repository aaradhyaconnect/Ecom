import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const filter = searchParams.get("filter") || "all";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reviews")
      .select("*, product:products(name, slug)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filter === "approved") {
      query = query.eq("is_approved", true);
    } else if (filter === "pending") {
      query = query.eq("is_approved", false);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, total: count || 0, page, limit });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const { id, is_approved } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("reviews")
      .update({ is_approved })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Recalculate product rating
    const { data: review } = await supabase.from("reviews").select("product_id").eq("id", id).single();
    if (review) {
      const { data: reviews } = await supabase.from("reviews").select("rating").eq("product_id", review.product_id).eq("is_approved", true);
      if (reviews) {
        const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
        await supabase.from("products").update({ rating: Math.round(avg * 100) / 100, review_count: reviews.length }).eq("id", review.product_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    // Get review's product_id before deleting
    const { data: review } = await supabase.from("reviews").select("product_id").eq("id", id).single();

    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Recalculate product rating after delete
    if (review) {
      const { data: reviews } = await supabase.from("reviews").select("rating").eq("product_id", review.product_id).eq("is_approved", true);
      const avg = reviews && reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      await supabase.from("products").update({ rating: Math.round(avg * 100) / 100, review_count: reviews?.length || 0 }).eq("id", review.product_id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
