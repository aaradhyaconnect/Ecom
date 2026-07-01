import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code || typeof code !== "string") {
      return Response.json(
        { success: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return Response.json(
        { success: false, error: "Invalid or expired coupon code" },
        { status: 404 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(coupon.expires_at);

    if (expiresAt < now) {
      return Response.json(
        { success: false, error: "This coupon has expired" },
        { status: 410 }
      );
    }

    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return Response.json(
        { success: false, error: "This coupon has reached its usage limit" },
        { status: 410 }
      );
    }

    return Response.json({
      success: true,
      data: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order: coupon.min_order,
        max_discount: coupon.max_discount,
      },
    });
  } catch {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
