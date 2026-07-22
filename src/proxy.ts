import { updateSession } from "@/lib/supabase/middleware";
import { isMaintenanceMode } from "@/lib/utils/maintenance";
import { type NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/account",
  "/checkout",
];

const adminRoutes = ["/admin"];
const supplierRoutes = ["/supplier"];

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isMaintPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/maintenance" ||
    pathname.includes(".");
  if (!isMaintPath) {
    const maintenance = await isMaintenanceMode();
    if (maintenance) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAdmin = adminRoutes.some((r) => pathname.startsWith(r));
  const isAdminLogin = pathname === "/admin/login";
  const isSupplier = supplierRoutes.some((r) => pathname.startsWith(r));
  const isSupplierLogin = pathname === "/supplier/login";
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password";

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (!user && isAdmin && !isAdminLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (user && isAdmin && !isAdminLogin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  if (!user && isSupplier && !isSupplierLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/supplier/login";
    return NextResponse.redirect(url);
  }

  if (user && isSupplier && !isSupplierLogin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "supplier") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
