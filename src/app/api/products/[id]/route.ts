import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`slug.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: data as Product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch product";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
