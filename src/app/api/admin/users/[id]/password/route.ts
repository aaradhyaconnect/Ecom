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

    const adminClient = await createAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(
      staffUser.user_id,
      { password: body.password }
    );

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
