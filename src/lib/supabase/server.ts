import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { StaffRole, Permissions, StaffUser } from "@/types";
import { getPermissionsForRole } from "@/lib/permissions";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createServiceClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false },
    }
  );
}

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export function createPublicClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false },
    }
  );
}

export async function createAdminClient() {
  return createServiceClient();
}

export interface AdminAuthResult {
  supabase: ReturnType<typeof createServiceClient>;
  user: SupabaseUser;
  profile: { role: string };
  staffUser: StaffUser | null;
  staffRole: StaffRole;
  permissions: Permissions;
}

export async function requireAdmin(): Promise<
  AdminAuthResult | { response: NextResponse }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return {
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  // Try to get staff_user record (may not exist for legacy admins)
  const { data: staffUser } = await supabase
    .from("staff_users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const staffRole: StaffRole = staffUser?.role ?? "super_admin";
  const permissions = getPermissionsForRole(staffRole, staffUser?.permissions as Partial<Permissions> | undefined);

  return {
    supabase: createServiceClient(),
    user,
    profile: profile!,
    staffUser: staffUser as StaffUser | null,
    staffRole,
    permissions,
  };
}

/**
 * Require a specific permission. Returns 403 if the user lacks it.
 */
export async function requirePermission(
  module: string,
  action: string
): Promise<AdminAuthResult | { response: NextResponse }> {
  const auth = await requireAdmin();
  if ("response" in auth) return auth;

  // Super admins bypass all permission checks
  if (auth.staffRole === "super_admin") return auth;

  const hasPermission = auth.permissions[module as keyof Permissions]?.[action as keyof Permissions[keyof Permissions]] ?? false;
  if (!hasPermission) {
    return {
      response: NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return auth;
}
