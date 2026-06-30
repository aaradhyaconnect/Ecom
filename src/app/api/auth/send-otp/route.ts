import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, phone } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "Email or phone is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    if (phone) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "OTP sent to your phone",
        channel: "phone",
      });
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      channel: "email",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
