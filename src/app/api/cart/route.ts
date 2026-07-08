import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return Response.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const sanitized = items
      .filter((item: { product_id?: string; quantity?: number; size?: string; color?: string }) => {
        if (!item.product_id || typeof item.product_id !== "string") return false;
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 20) return false;
        return true;
      })
      .map((item: { product_id: string; quantity: number; size: string; color: string }) => ({
        user_id: user.id,
        product_id: item.product_id,
        quantity: item.quantity,
        size: String(item.size || ""),
        color: String(item.color || ""),
      }));

    if (sanitized.length === 0) {
      return Response.json(
        { success: false, error: "No valid items" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("cart_items").upsert(sanitized, {
      onConflict: "user_id,product_id,size,color",
      ignoreDuplicates: false,
    });

    if (error) {
      return Response.json(
        { success: false, error: "Failed to save cart" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, message: "Cart saved" });
  } catch {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
