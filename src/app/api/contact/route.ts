import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetIn } = checkRateLimit(`contact:${ip}`, { windowMs: 60000, maxRequests: 5 });
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many messages. Try again in ${Math.ceil(resetIn / 1000)}s` },
        { status: 429 }
      );
    }

    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid input types" }, { status: 400 });
    }

    if (name.length > 200 || email.length > 320 || message.length > 5000) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    const adminDb = await createAdminClient();
    const { error } = await adminDb.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject ? String(subject).trim().slice(0, 500) : null,
      message: message.trim(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
