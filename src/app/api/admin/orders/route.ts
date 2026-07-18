import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("orders", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "";
    const search = url.searchParams.get("search") || "";
    const fulfillment = url.searchParams.get("fulfillment") || "";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("orders")
      .select("*, profiles!inner(name, email), order_fulfillments(*)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("order_status", status);
    }

    if (fulfillment) {
      query = query.eq("fulfillment_type", fulfillment);
    }

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        `order_id.ilike.%${escaped}%,profiles.name.ilike.%${escaped}%`
      );
    }

    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt("created_at", toDate.toISOString());
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const orders = data || [];

    const notesCountMap: Record<string, number> = {};
    if (orders.length > 0) {
      const orderIds = orders.map((o: { id: string }) => o.id);
      const { data: notesCounts } = await supabase
        .from("order_notes")
        .select("order_id")
        .in("order_id", orderIds);
      if (notesCounts) {
        for (const n of notesCounts) {
          notesCountMap[n.order_id] = (notesCountMap[n.order_id] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: orders,
      notes_count: notesCountMap,
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
