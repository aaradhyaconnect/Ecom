import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("@") && !rawNext.includes("://") ? rawNext : "/";
  const isPopup = searchParams.get("popup") === "true";

  if (code) {
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
              request.cookies.set(name, value);
              pendingCookies.push({ name, value, options });
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
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
            avatar_url: user.user_metadata?.avatar_url || null,
            role: "customer",
          });
          if (profileError) console.error("Profile creation failed:", profileError.message);
        }

        const isAdmin = profile?.role === "admin";
        const redirectPath = isAdmin ? "/admin" : next;

        if (isPopup) {
          const redirectUrl = `${origin}${redirectPath}`;

          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token ?? "";
          const refreshToken = session?.refresh_token ?? "";

          const payload = JSON.stringify({
            type: "auth-callback",
            success: true,
            path: redirectPath,
            accessToken,
            refreshToken,
          });

          const html = `<!DOCTYPE html><html><head><title>Authenticating...</title></head><body>
            <script>
              (function() {
                var done = false;
                var payload = ${JSON.stringify(payload)};
                function finish() {
                  if (done) return;
                  done = true;
                  try {
                    if (window.opener) {
                      window.opener.postMessage(JSON.parse(payload), window.location.origin);
                      setTimeout(function() { window.close(); }, 200);
                    } else {
                      window.location.href = ${JSON.stringify(redirectUrl)};
                    }
                  } catch(e) {
                    window.location.href = ${JSON.stringify(redirectUrl)};
                  }
                }
                if (document.readyState === 'complete') { finish(); }
                else { window.onload = finish; }
                setTimeout(finish, 1000);
              })();
            </script>
            <p>Authenticating... This window should close automatically.</p>
          </body></html>`;
          const popupResponse = new NextResponse(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
          pendingCookies.forEach(({ name, value, options }) => {
            popupResponse.cookies.set(name, value, options as CookieOptions);
          });
          return popupResponse;
        }

        const redirectUrl = `${origin}${redirectPath}`;
        const redirectResponse = NextResponse.redirect(redirectUrl);
        pendingCookies.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options as CookieOptions);
        });
        return redirectResponse;
      }
    }

    return NextResponse.redirect(
      `${origin}/login?error=exchange_failed&message=${encodeURIComponent(error?.message || "Unknown error")}&redirect=${encodeURIComponent(next)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=no_code&redirect=${encodeURIComponent(next)}`);
}
