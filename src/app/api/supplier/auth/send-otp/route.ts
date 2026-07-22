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

    // 1. Look up supplier
    const { data: supplier } = await adminDb
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

    // 2. Ensure auth user exists and is linked
    if (!supplier.auth_user_id) {
      // Try to find existing auth user by email
      const { data: listUsers } = await adminDb.auth.admin.listUsers();
      const existingUser = listUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        // Link existing auth user to this supplier
        await adminDb
          .from("suppliers")
          .update({ auth_user_id: existingUser.id })
          .eq("id", supplier.id);

        // Ensure profile exists with supplier role
        const { data: existingProfile } = await adminDb
          .from("profiles")
          .select("id")
          .eq("id", existingUser.id)
          .single();

        if (!existingProfile) {
          await adminDb.from("profiles").insert({
            id: existingUser.id,
            email: email,
            name: email.split("@")[0],
            role: "supplier",
          });
        } else {
          // Update role to supplier if it's not already
          await adminDb
            .from("profiles")
            .update({ role: "supplier" })
            .eq("id", existingUser.id)
            .neq("role", "supplier");
        }
      } else {
        // Create new auth user (no invite email, just create the account)
        const { data: newUser, error: createError } = await adminDb.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { role: "supplier", name: supplier.id },
        });

        if (createError) {
          return NextResponse.json({ success: false, error: "Failed to create supplier account" }, { status: 500 });
        }

        if (newUser?.user) {
          await adminDb
            .from("suppliers")
            .update({ auth_user_id: newUser.user.id })
            .eq("id", supplier.id);

          // Ensure profile exists (trigger should handle this, but be safe)
          const { data: newProfile } = await adminDb
            .from("profiles")
            .select("id")
            .eq("id", newUser.user.id)
            .single();

          if (!newProfile) {
            await adminDb.from("profiles").insert({
              id: newUser.user.id,
              email: email,
              name: email.split("@")[0],
              role: "supplier",
            });
          }
        }
      }
    }

    // 3. Send OTP via Supabase signInWithOtp
    const { error: otpError } = await supabaseAnon.auth.signInWithOtp({ email });
    if (otpError) {
      return NextResponse.json({ success: false, error: otpError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
