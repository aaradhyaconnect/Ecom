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

    // 1. Verify OTP
    const { data, error } = await supabaseAnon.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user) {
      return NextResponse.json({ success: false, error: "Invalid or expired OTP code" }, { status: 401 });
    }

    const adminDb = await createAdminClient();
    const userId = data.user.id;

    // 2. Ensure profile exists with supplier role
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile) {
      // Profile doesn't exist — create it
      await adminDb.from("profiles").insert({
        id: userId,
        email: email,
        name: data.user.user_metadata?.name || email.split("@")[0],
        role: "supplier",
      });
    } else if (profile.role !== "supplier") {
      // Profile exists but wrong role — update it
      await adminDb
        .from("profiles")
        .update({ role: "supplier" })
        .eq("id", userId);
    }

    // 3. Ensure supplier record is linked to this auth user
    const { data: supplier } = await adminDb
      .from("suppliers")
      .select("id, is_active")
      .eq("auth_user_id", userId)
      .single();

    if (!supplier) {
      // No supplier linked — try to find one by email and link it
      const { data: unlinkedSupplier } = await adminDb
        .from("suppliers")
        .select("id, is_active")
        .eq("email", email)
        .single();

      if (unlinkedSupplier) {
        await adminDb
          .from("suppliers")
          .update({ auth_user_id: userId })
          .eq("id", unlinkedSupplier.id);

        if (!unlinkedSupplier.is_active) {
          await supabaseAnon.auth.signOut();
          return NextResponse.json({ success: false, error: "Supplier account is inactive" }, { status: 403 });
        }
      } else {
        await supabaseAnon.auth.signOut();
        return NextResponse.json({ success: false, error: "No supplier account found for this email" }, { status: 403 });
      }
    } else if (!supplier.is_active) {
      await supabaseAnon.auth.signOut();
      return NextResponse.json({ success: false, error: "Supplier account is inactive" }, { status: 403 });
    }

    // 4. Return session
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
