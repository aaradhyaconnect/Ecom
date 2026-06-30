import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import type { Coupon } from "@/types";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data as Coupon[] });
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

    if (!body.code || !body.discount_value) {
      return NextResponse.json(
        { success: false, error: "Code and discount value are required" },
        { status: 400 }
      );
    }

    const coupon = {
      code: body.code.toUpperCase(),
      description: body.description || "",
      discount_type: body.discount_type || "percentage",
      discount_value: Number(body.discount_value),
      min_order: Number(body.min_order) || 0,
      max_discount: body.max_discount ? Number(body.max_discount) : null,
      usage_limit: Number(body.usage_limit) || 0,
      used_count: 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
      expires_at: body.expires_at || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("coupons")
      .insert(coupon)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data as Coupon });
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    if (updates.code) updates.code = updates.code.toUpperCase();
    if (updates.discount_value) updates.discount_value = Number(updates.discount_value);
    if (updates.min_order) updates.min_order = Number(updates.min_order);
    if (updates.max_discount) updates.max_discount = Number(updates.max_discount);
    if (updates.usage_limit) updates.usage_limit = Number(updates.usage_limit);

    const { data, error } = await supabase
      .from("coupons")
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

    return NextResponse.json({ success: true, data: data as Coupon });
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
        { success: false, error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Coupon deleted" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
