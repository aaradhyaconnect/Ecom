import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "items array is required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.id || item.sort_order === undefined) {
        return NextResponse.json(
          { success: false, error: "Each item must have id and sort_order" },
          { status: 400 }
        );
      }
    }

    const updates = items.map((item) =>
      supabase
        .from("categories")
        .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
        .eq("id", item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0].error!.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
