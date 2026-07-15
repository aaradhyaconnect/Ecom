import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission("marketing", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const filter = searchParams.get("filter") || "all";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filter === "unread") {
      query = query.eq("is_read", false);
    } else if (filter === "read") {
      query = query.eq("is_read", true);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, total: count || 0, page, limit });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requirePermission("marketing", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const body = await request.json();
    const { id, is_read } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requirePermission("marketing", "delete");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("contact_messages").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
