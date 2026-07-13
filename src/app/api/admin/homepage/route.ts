import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { data, error } = await supabase.from("homepage_sections").select("*").order("sort_order");
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
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
    const { sections } = body;

    if (!Array.isArray(sections)) {
      return NextResponse.json({ success: false, error: "sections array required" }, { status: 400 });
    }

    const updates = sections.map((s: { id: string; is_active?: boolean; sort_order?: number; title?: string; subtitle?: string; description?: string; image?: string; link?: string; config?: unknown }) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (s.is_active !== undefined) update.is_active = s.is_active;
      if (s.sort_order !== undefined) update.sort_order = s.sort_order;
      if (s.title !== undefined) update.title = s.title;
      if (s.subtitle !== undefined) update.subtitle = s.subtitle;
      if (s.description !== undefined) update.description = s.description;
      if (s.image !== undefined) update.image = s.image;
      if (s.link !== undefined) update.link = s.link;
      if (s.config !== undefined) update.config = JSON.stringify(s.config);
      return supabase.from("homepage_sections").update(update).eq("id", s.id);
    });

    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
