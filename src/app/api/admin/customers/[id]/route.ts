import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/supabase/server";
import { logActivity } from "@/lib/utils/activity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_id, total, order_status, payment_status, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    const { count: order_count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id);

    const { data: orderTotals } = await supabase
      .from("orders")
      .select("total")
      .eq("user_id", id);

    const total_spent = (orderTotals ?? []).reduce((sum, o) => sum + (o.total || 0), 0);

    return NextResponse.json({
      success: true,
      data: { ...profile, orders: orders ?? [], order_count: order_count ?? 0, total_spent },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission("customers", "edit");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.role !== undefined) updates.role = body.role;
    if (body.is_banned !== undefined) updates.is_banned = body.is_banned;
    if (body.notes !== undefined) updates.notes = body.notes;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logActivity({
      action: "customer_updated",
      entity: "customer",
      entityId: id,
      userId: auth.user?.id,
      before: { name: body.name, email: body.email, phone: body.phone, role: body.role, is_banned: body.is_banned },
      after: { name: data.name, email: data.email, phone: data.phone, role: data.role, is_banned: data.is_banned },
    });

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
    const auth = await requirePermission("customers", "delete");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete customer with ${count} order(s). Ban them instead.` },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logActivity({
      action: "customer_deleted",
      entity: "customer",
      entityId: id,
      userId: auth.user?.id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
