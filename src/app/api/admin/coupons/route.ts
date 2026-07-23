import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";
import type { Coupon } from "@/types";

export async function GET() {
  try {
    const auth = await requirePermission("marketing", "view");
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
    const auth = await requirePermission("marketing", "create");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();

    if (!body.code || !body.discount_value) {
      return NextResponse.json(
        { success: false, error: "Code and discount value are required" },
        { status: 400 }
      );
    }

    const discountValue = Number(body.discount_value);
    const discountType = body.discount_type || "percentage";
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json(
        { success: false, error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }
    if (discountValue < 0) {
      return NextResponse.json(
        { success: false, error: "Discount value cannot be negative" },
        { status: 400 }
      );
    }

    const minOrder = Number(body.min_order) || 0;
    if (minOrder < 0) {
      return NextResponse.json(
        { success: false, error: "Minimum order cannot be negative" },
        { status: 400 }
      );
    }

    const coupon = {
      code: body.code.toUpperCase(),
      description: body.description || "",
      discount_type: discountType,
      discount_value: discountValue,
      min_order: minOrder,
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

    await logActivity({
      action: "coupon_created",
      entity: "coupon",
      entityId: data.id,
      userId: auth.user?.id,
      after: { code: data.code, discount_type: data.discount_type, discount_value: data.discount_value },
    });

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
    const auth = await requirePermission("marketing", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const { id, ...rawUpdates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    const allowedFields = ["code", "description", "discount_type", "discount_value", "min_order", "max_discount", "usage_limit", "expires_at", "is_active"] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in rawUpdates) updates[key] = rawUpdates[key];
    }

    if (updates.code) updates.code = String(updates.code).toUpperCase();
    if (updates.discount_value !== undefined) updates.discount_value = Number(updates.discount_value);
    if (updates.min_order !== undefined) updates.min_order = Number(updates.min_order);
    if (updates.max_discount !== undefined) updates.max_discount = updates.max_discount ? Number(updates.max_discount) : null;
    if (updates.usage_limit !== undefined) updates.usage_limit = Number(updates.usage_limit);

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

    await logActivity({
      action: "coupon_updated",
      entity: "coupon",
      entityId: id,
      userId: auth.user?.id,
      before: { code: rawUpdates.code, discount_type: rawUpdates.discount_type, discount_value: rawUpdates.discount_value },
      after: { code: data.code, discount_type: data.discount_type, discount_value: data.discount_value },
    });

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
    const auth = await requirePermission("marketing", "delete");
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

    await logActivity({
      action: "coupon_deleted",
      entity: "coupon",
      entityId: id,
      userId: auth.user?.id,
    });

    return NextResponse.json({ success: true, message: "Coupon deleted" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
