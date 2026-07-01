import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("@") ? rawNext : "/";
  const isPopup = searchParams.get("popup") === "true";

  if (code) {
    const response = NextResponse.next();

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
              response.cookies.set(name, value, options);
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

        const isAdmin = profile?.role === "admin";
        const redirectPath = isAdmin ? "/admin" : next;

        if (isPopup) {
          const html = `<!DOCTYPE html><html><head><title>Authenticating...</title></head><body>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'auth-callback', success: true, path: '${redirectPath}' }, '${origin}');
                  window.close();
                } else {
                  window.location.href = '${origin}${redirectPath}';
                }
              } catch(e) {
                window.location.href = '${origin}${redirectPath}';
              }
            </script>
            <p>Authenticating... This window should close automatically.</p>
          </body></html>`;
          return new NextResponse(html, {
            status: 200,
            headers: { "Content-Type": "text/html" },
          });
        }

        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }

    return NextResponse.redirect(
      `${origin}/login?error=exchange_failed&message=${encodeURIComponent(error?.message || "Unknown error")}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
