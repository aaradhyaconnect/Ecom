import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import type { OrderNote } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("orders", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data, error } = await supabase
      .from("order_notes")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (data || []) as OrderNote[],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("orders", "edit");
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;

    const body = await request.json();

    if (!body.note || typeof body.note !== "string" || !body.note.trim()) {
      return NextResponse.json(
        { success: false, error: "Note is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("order_notes")
      .insert({
        order_id: id,
        note: body.note.trim(),
        is_internal: body.is_internal ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as OrderNote,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
