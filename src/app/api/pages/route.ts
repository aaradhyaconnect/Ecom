import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    const supabase = await createServerSupabase();

    if (slug) {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("is_published", true)
      .order("slug");

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
