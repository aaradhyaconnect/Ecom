import { NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data, error } = await supabase
      .from("staff_users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Staff user not found" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", data.user_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        email: profile?.email ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.role !== undefined) {
      const validRoles = ["staff", "admin", "super_admin"];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { success: false, error: "Invalid role" },
          { status: 400 }
        );
      }
      updates.role = body.role;
    }
    if (body.permissions !== undefined) updates.permissions = body.permissions;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("staff_users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;

    const { data: staffUser, error: fetchError } = await supabase
      .from("staff_users")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !staffUser) {
      return NextResponse.json(
        { success: false, error: "Staff user not found" },
        { status: 404 }
      );
    }

    if (staffUser.user_id === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const adminClient = await createAdminClient();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const delRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${staffUser.user_id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    });

    if (!delRes.ok) {
      const errBody = await delRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: (errBody as { msg?: string }).msg || "Failed to delete auth user" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("staff_users").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
