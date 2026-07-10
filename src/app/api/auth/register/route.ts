import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { rateLimitAuth, cleanupRateLimitMap } from "@/lib/utils/rate-limit";

export async function POST(request: Request) {
  cleanupRateLimitMap();

  const { allowed, resetIn } = rateLimitAuth(request);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: `Too many attempts. Try again in ${Math.ceil(resetIn / 1000)}s` },
      { status: 429 }
    );
  }

  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: "Password must contain at least one letter and one number" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email,
      name,
      role: "customer",
    });

    if (profileError) {
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: authData.user.id,
          email: authData.user.email,
          name,
        },
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
