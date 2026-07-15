import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("reports", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const entity = url.searchParams.get("entity") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (entity) {
      query = query.eq("entity", entity);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("reports", "view");
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const body = await request.json();
    const { action, entity, entity_id, details } = body;

    if (!action || !entity) {
      return NextResponse.json({ success: false, error: "Missing action or entity" }, { status: 400 });
    }

    const { error } = await supabase.from("activity_logs").insert({
      user_id: user?.id || null,
      action,
      entity,
      entity_id: entity_id || null,
      details: details || {},
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
