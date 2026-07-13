import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { rateLimitOtp, cleanupRateLimitMap } from "@/lib/utils/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  cleanupRateLimitMap();

  try {
    const { email, phone, token } = await request.json();

    if ((!email && !phone) || !token) {
      return NextResponse.json(
        { success: false, error: "Email or phone and OTP are required" },
        { status: 400 }
      );
    }

    const identifier = email || phone;
    const { allowed, resetIn } = rateLimitOtp(request, identifier);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: `Too many attempts. Try again in ${Math.ceil(resetIn / 1000)}s` },
        { status: 429 }
      );
    }

    const supabase = await createServerSupabase();

    if (phone) {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (!profile) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.user_metadata?.name || phone,
            phone,
            role: "customer",
          });
          if (profileError) logger.error("Profile upsert failed", profileError);
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.name || email.split("@")[0],
          role: "customer",
        });
        if (profileError) logger.error("Profile upsert failed", profileError);
      }
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
