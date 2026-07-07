import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("*, orders(id, total, order_status)", { count: "exact" })
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        `name.ilike.%${escaped}%,email.ilike.%${escaped}%`
      );
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const customers = (data || []).map((c) => {
      const orders = c.orders || [];
      const totalSpent = orders
        .filter((o: { order_status: string }) => o.order_status !== "cancelled" && o.order_status !== "returned")
        .reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar_url: c.avatar_url,
        created_at: c.created_at,
        order_count: orders.length,
        total_spent: totalSpent,
      };
    });

    return NextResponse.json({
      success: true,
      data: customers,
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
