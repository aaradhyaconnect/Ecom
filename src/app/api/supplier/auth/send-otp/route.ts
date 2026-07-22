import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = `${ip}:${email}`;
    const now = Date.now();
    const existing = rateLimitMap.get(key);
    if (existing && existing.resetAt > now) {
      if (existing.count >= 5) {
        return NextResponse.json({ success: false, error: "Too many attempts. Try again later." }, { status: 429 });
      }
      existing.count++;
    } else {
      rateLimitMap.set(key, { count: 1, resetAt: now + 5 * 60 * 1000 });
    }

    const adminDb = await createAdminClient();

    const { data: supplier, error: supplierError } = await adminDb
      .from("suppliers")
      .select("id, auth_user_id, is_active")
      .eq("email", email)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ success: false, error: "No supplier found with this email" }, { status: 404 });
    }

    if (!supplier.is_active) {
      return NextResponse.json({ success: false, error: "Supplier account is inactive" }, { status: 403 });
    }

    if (!supplier.auth_user_id) {
      const { data: newUser } = await adminDb.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: "supplier" },
      });

      if (newUser?.user) {
        await adminDb
          .from("suppliers")
          .update({ auth_user_id: newUser.user.id })
          .eq("id", supplier.id);
      }
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { error: otpError } = await supabaseAnon.auth.signInWithOtp({ email });
    if (otpError) {
      return NextResponse.json({ success: false, error: otpError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
