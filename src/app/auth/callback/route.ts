import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("@") ? rawNext : "/";

  if (code) {
    const redirectUrl = new URL(`${origin}${next}`);
    const redirectResponse = NextResponse.redirect(redirectUrl);

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
              request.cookies.set(name, value);
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile) {
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
            avatar_url: user.user_metadata?.avatar_url || null,
            role: "customer",
          });
        }

        if (profile?.role === "admin" || (!profile && user.user_metadata?.role === "admin")) {
          redirectUrl.pathname = "/admin";
          const adminRedirect = NextResponse.redirect(redirectUrl);
          redirectResponse.cookies.getAll().forEach((cookie) => {
            adminRedirect.cookies.set(cookie.name, cookie.value, {
              httpOnly: cookie.httpOnly,
              path: cookie.path,
              maxAge: cookie.maxAge,
              sameSite: cookie.sameSite,
              secure: cookie.secure,
            });
          });
          return adminRedirect;
        }
      }

      return redirectResponse;
    }

    return NextResponse.redirect(
      `${origin}/login?error=exchange_failed&message=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
