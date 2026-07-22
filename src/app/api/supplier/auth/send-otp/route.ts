import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailViaResend(to: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM_ADDRESS || "noreply@resend.dev",
      to,
      subject: "Your G2I Style Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; text-align: center; padding: 40px 20px;">
          <h2 style="color: #111; font-weight: 300; letter-spacing: 2px;">SUPPLIER PORTAL</h2>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Your one-time login code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111; margin: 20px 0; padding: 16px; background: #FAF9F6; border-radius: 8px;">${code}</div>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    }),
  });

  return res.ok;
}

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

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

    const code = generateOtp();
    const codeHash = hashOtp(code);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const sent = await sendEmailViaResend(email, code);
    if (!sent) {
      return NextResponse.json({ success: false, error: "Failed to send OTP email" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, message: "OTP sent to your email" });

    response.cookies.set("supplier_otp", JSON.stringify({ email, hash: codeHash, expiresAt }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
