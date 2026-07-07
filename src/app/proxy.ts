import { type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicPaths = ["/", "/products", "/product", "/search", "/login", "/signup", "/verify-otp", "/auth", "/api/auth", "/api/products", "/api/coupons", "/api/newsletter", "/api/contact", "/_next", "/favicon.ico", "/manifest.json", "/placeholder.svg", "/online"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Admin routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLogin = pathname === "/admin/login";

  // Skip auth check for public routes and admin login
  if (isPublic || isAdminLogin) {
    return undefined;
  }

  // For admin routes, check admin role
  if (isAdminRoute || isAdminApi) {
    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return Response.redirect(new URL("/admin/login", request.url));
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return Response.redirect(new URL("/", request.url));
      }
    } catch {
      return Response.redirect(new URL("/admin/login", request.url));
    }
  }

  // For protected shop routes, check auth
  const protectedPaths = ["/account", "/checkout", "/orders"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return Response.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return Response.redirect(url);
    }
  }

  return undefined;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
