import { NextResponse } from "next/server";
import { requirePermission, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requirePermission("users", "view");
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 50;
    const role = url.searchParams.get("role") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("staff_users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        `display_name.ilike.%${escaped}%,username.ilike.%${escaped}%`
      );
    }

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const userIds = (data || []).map((u) => u.user_id).filter(Boolean);
    let emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      (profiles || []).forEach((p) => {
        emailMap[p.id] = p.email;
      });
    }

    const users = (data || []).map((u) => ({
      id: u.id,
      user_id: u.user_id,
      display_name: u.display_name,
      username: u.username,
      role: u.role,
      permissions: u.permissions,
      is_active: u.is_active,
      last_login: u.last_login,
      email: emailMap[u.user_id] || null,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: users,
      current_user_id: auth.user?.id || null,
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

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("users", "create");
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { email, password, display_name, username, role, permissions } = body;

    if (!email || !password || !display_name || !username || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validRoles = ["staff", "admin", "super_admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    const adminClient = await createAdminClient();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const gotriveRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        apikey: serviceKey,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: display_name },
      }),
    });

    if (!gotriveRes.ok) {
      const errBody = await gotriveRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: (errBody as { msg?: string; message?: string }).msg || (errBody as { msg?: string; message?: string }).message || "Failed to create auth user" },
        { status: 400 }
      );
    }

    const authData = await gotriveRes.json();
    const authUser = authData as { id: string; email: string };

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({ id: authUser.id, role: "admin", name: display_name }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 }
      );
    }

    const { data: staffUser, error: staffError } = await adminClient
      .from("staff_users")
      .insert({
        user_id: authUser.id,
        display_name,
        username,
        role,
        permissions: permissions || {},
        is_active: true,
      })
      .select()
      .single();

    if (staffError) {
      return NextResponse.json(
        { success: false, error: staffError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: staffUser }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
