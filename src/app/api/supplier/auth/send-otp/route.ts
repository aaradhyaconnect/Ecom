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

    const supabase = await createAdminClient();

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id, auth_user_id, is_active")
      .eq("email", email)
      .single();

    if (!supplier || !supplier.is_active) {
      return NextResponse.json({ success: false, error: "No active supplier found with this email" }, { status: 404 });
    }

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    if (supplier.auth_user_id) {
      const { error } = await supabaseAnon.auth.signInWithOtp({ email });
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    } else {
      const { data: authData, error: createError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: "supplier", name: supplier.id },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://g2istyle.com"}/supplier/login`,
      });

      if (createError) {
        const { error: otpError } = await supabaseAnon.auth.signInWithOtp({ email });
        if (otpError) {
          return NextResponse.json({ success: false, error: otpError.message }, { status: 500 });
        }
      } else if (authData?.user) {
        await supabase
          .from("suppliers")
          .update({ auth_user_id: authData.user.id })
          .eq("id", supplier.id);

        const { error: otpError } = await supabaseAnon.auth.signInWithOtp({ email });
        if (otpError) {
          return NextResponse.json({ success: false, error: otpError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
