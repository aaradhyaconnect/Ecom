import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
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

    const { data, error } = await supabase
      .from("wishlist")
      .select("*, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { success: false, error: "Failed to fetch wishlist" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { product_id } = body;

    if (!product_id) {
      return Response.json(
        { success: false, error: "product_id is required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (existing) {
      return Response.json(
        { success: false, error: "Item already in wishlist" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("wishlist")
      .insert({ user_id: user.id, product_id })
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: "Failed to add to wishlist" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = request.nextUrl;
    const product_id = searchParams.get("product_id");

    if (!product_id) {
      return Response.json(
        { success: false, error: "product_id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", product_id);

    if (error) {
      return Response.json(
        { success: false, error: "Failed to remove from wishlist" },
        { status: 500 }
      );
    }

    return Response.json({ success: true, message: "Item removed" });
  } catch (error) {
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
