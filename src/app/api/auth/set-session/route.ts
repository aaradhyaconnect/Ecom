import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  "http://localhost:3000",
].filter(Boolean) as string[];

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const target = origin || referer;
  if (!target) return false;
  try {
    const url = new URL(target);
    return ALLOWED_ORIGINS.some((allowed) => url.origin === allowed);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

    const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options });
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const response = NextResponse.json({ user: data.user });
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as CookieOptions);
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
