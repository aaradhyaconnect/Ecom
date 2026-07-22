import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();
    if (!email || !token) {
      return NextResponse.json({ success: false, error: "Email and OTP code are required" }, { status: 400 });
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const otpCookie = cookieHeader.split(";").find((c) => c.trim().startsWith("supplier_otp="));

    if (!otpCookie) {
      return NextResponse.json({ success: false, error: "OTP session expired. Please request a new code." }, { status: 401 });
    }

    let stored: { email: string; hash: string; expiresAt: number };
    try {
      stored = JSON.parse(decodeURIComponent(otpCookie.split("=").slice(1).join("=")));
    } catch {
      return NextResponse.json({ success: false, error: "Invalid OTP session" }, { status: 401 });
    }

    if (stored.expiresAt < Date.now()) {
      return NextResponse.json({ success: false, error: "OTP expired. Please request a new code." }, { status: 401 });
    }

    if (stored.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Email mismatch" }, { status: 401 });
    }

    const codeHash = hashOtp(token.trim());
    if (codeHash !== stored.hash) {
      return NextResponse.json({ success: false, error: "Invalid OTP code" }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "Supplier account not found or inactive" }, { status: 403 });
    }

    let userId = supplier.auth_user_id;

    if (!userId) {
      const { data: profile } = await adminDb
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      userId = profile?.id;
    }

    if (!userId) {
      const { data: newUser } = await adminDb.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: "supplier" },
      });
      userId = newUser?.user?.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Could not create or find auth account" }, { status: 500 });
    }

    const { data: profile } = await adminDb
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      await adminDb.from("profiles").insert({
        id: userId,
        email: email,
        name: email.split("@")[0],
        role: "supplier",
      });
    }

    if (supplier.auth_user_id !== userId) {
      await adminDb
        .from("suppliers")
        .update({ auth_user_id: userId })
        .eq("id", supplier.id);
    }

    const tempPassword = crypto.randomBytes(16).toString("hex") + "Aa1!";

    await adminDb.auth.admin.updateUserById(userId, { password: tempPassword });

    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (sessionError || !sessionData.session) {
      return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      data: {
        session: sessionData.session,
        user: { id: userId, email },
      },
    });

    response.cookies.set("supplier_otp", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
