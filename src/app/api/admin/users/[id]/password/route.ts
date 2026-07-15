import { NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";

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

    if (!body.password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${staffUser.user_id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        apikey: serviceKey,
      },
      body: JSON.stringify({ password: body.password }),
    });

    if (!updateRes.ok) {
      const errBody = await updateRes.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: (errBody as { msg?: string }).msg || "Failed to update password" },
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
