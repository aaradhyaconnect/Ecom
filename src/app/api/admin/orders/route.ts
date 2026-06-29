import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Order } from "@/types";

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "";
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("orders")
      .select("*, profiles!inner(name, email)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("order_status", status);
    }

    if (search) {
      query = query.or(
        `order_id.ilike.%${search}%,profiles.name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
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
