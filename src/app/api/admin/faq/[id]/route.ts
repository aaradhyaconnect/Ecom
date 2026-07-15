import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("marketing", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.question !== undefined) updates.question = body.question;
    if (body.answer !== undefined) updates.answer = body.answer;
    if (body.category !== undefined) updates.category = body.category;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data, error } = await supabase.from("faq_items").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("marketing", "delete");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
