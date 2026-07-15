import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ("response" in auth) return auth.response;

    return NextResponse.json({
      success: true,
      data: {
        staffRole: auth.staffRole,
        permissions: auth.permissions,
        user: {
          id: auth.user.id,
          email: auth.user.email,
        },
        staffUser: auth.staffUser
          ? {
              id: auth.staffUser.id,
              display_name: auth.staffUser.display_name,
              username: auth.staffUser.username,
              role: auth.staffUser.role,
            }
          : null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
