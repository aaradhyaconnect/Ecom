import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      return NextResponse.json({ user: profile });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
        phone: user.phone ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: "customer",
        created_at: user.created_at ?? new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
