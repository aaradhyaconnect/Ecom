import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();
    if (!email || !token) {
      return NextResponse.json({ success: false, error: "Email and OTP code are required" }, { status: 400 });
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabaseAnon.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP code" }, { status: 401 });
    }

    const adminDb = await createAdminClient();

    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "supplier") {
      await supabaseAnon.auth.signOut();
      return NextResponse.json({ success: false, error: "This account is not a supplier" }, { status: 403 });
    }

    const { data: supplier } = await adminDb
      .from("suppliers")
      .select("id, is_active")
      .eq("auth_user_id", data.user.id)
      .single();

    if (!supplier || !supplier.is_active) {
      await supabaseAnon.auth.signOut();
      return NextResponse.json({ success: false, error: "Supplier account not found or inactive" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        session: data.session,
        user: { id: data.user.id, email: data.user.email },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
