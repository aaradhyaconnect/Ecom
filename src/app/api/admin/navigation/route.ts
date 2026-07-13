import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { data, error } = await supabase.from("navigation_links").select("*").order("sort_order");
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const { data, error } = await supabase
      .from("navigation_links")
      .insert({
        label: body.label,
        href: body.href,
        position: body.position,
        sort_order: body.sort_order ?? 0,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

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
    const { links } = body;

    if (!Array.isArray(links)) {
      return NextResponse.json({ success: false, error: "links array required" }, { status: 400 });
    }

    for (const link of links) {
      const updates: Record<string, unknown> = {};
      if (link.label !== undefined) updates.label = link.label;
      if (link.href !== undefined) updates.href = link.href;
      if (link.position !== undefined) updates.position = link.position;
      if (link.sort_order !== undefined) updates.sort_order = link.sort_order;
      if (link.is_active !== undefined) updates.is_active = link.is_active;

      if (Object.keys(updates).length > 0) {
        await supabase.from("navigation_links").update(updates).eq("id", link.id);
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
    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    const { error } = await supabase.from("navigation_links").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
