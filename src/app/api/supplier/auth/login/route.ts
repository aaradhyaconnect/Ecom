import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const adminDb = await createAdminClient();

    const { data: suppliers } = await adminDb
      .from("suppliers")
      .select("id, auth_user_id, is_active")
      .eq("email", email)
      .order("is_active", { ascending: false })
      .limit(1);

    const supplier = suppliers?.[0] || null;

    if (!supplier || !supplier.is_active) {
      return NextResponse.json({ success: false, error: "No active supplier found with this email" }, { status: 404 });
    }

    if (!supplier.auth_user_id) {
      return NextResponse.json({ success: false, error: "Account not set up. Please use email link to login first." }, { status: 400 });
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        session: data.session,
        user: { id: data.user.id, email: data.user.email },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
