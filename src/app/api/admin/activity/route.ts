import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { resolveStaffName } from "@/lib/utils/activity";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("reports", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const entity = url.searchParams.get("entity") || "";
    const userId = url.searchParams.get("user_id") || "";
    const action = url.searchParams.get("action") || "";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const search = url.searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (entity) query = query.eq("entity", entity);
    if (userId) query = query.eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (from) query = query.gte("created_at", from);
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("created_at", toDate.toISOString());
    }
    if (search) {
      query = query.or(`action.ilike.%${search}%,entity.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const logs = data || [];

    const uniqueUserIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))];
    const nameMap: Record<string, string> = {};
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    for (const uid of uniqueUserIds) {
      nameMap[uid] = await resolveStaffName(serviceClient, uid);
    }

    const enriched = logs.map((log) => ({
      ...log,
      user_name: log.user_id ? nameMap[log.user_id] || log.user_id.slice(0, 8) + "…" : "System",
    }));

    const { data: distinctActions } = await supabase
      .from("activity_logs")
      .select("action")
      .order("action");

    const uniqueActions = [...new Set((distinctActions || []).map((a) => a.action))];

    return NextResponse.json({
      success: true,
      data: enriched,
      total: count || 0,
      page,
      limit,
      actions: uniqueActions,
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
