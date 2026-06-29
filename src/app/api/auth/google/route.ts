import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { success: false, error: "Google credential is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    const { data: profile } = data.user
      ? await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()
      : { data: null };

    if (!profile && data.user) {
      const name =
        data.user.user_metadata?.name ||
        data.user.email?.split("@")[0] ||
        "User";
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        name,
        role: "customer",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
