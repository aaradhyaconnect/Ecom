import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface LogActivityOptions {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  details?: Record<string, unknown>;
  ip?: string;
}

export async function logActivity(options: LogActivityOptions): Promise<void>;
export async function logActivity(
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
  userId?: string
): Promise<void>;
export async function logActivity(
  actionOrOptions: string | LogActivityOptions,
  entity?: string,
  entityId?: string,
  details?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);

    let entry: Record<string, unknown>;

    if (typeof actionOrOptions === "object") {
      const opts = actionOrOptions;
      entry = {
        user_id: opts.userId || null,
        action: opts.action,
        entity: opts.entity,
        entity_id: opts.entityId || null,
        details: {
          ...opts.details,
          ...(opts.before ? { before: opts.before } : {}),
          ...(opts.after ? { after: opts.after } : {}),
        },
        ip_address: opts.ip || null,
      };
    } else {
      entry = {
        user_id: userId || null,
        action: actionOrOptions,
        entity: entity || "",
        entity_id: entityId || null,
        details: details || {},
      };
    }

    await supabase.from("activity_logs").insert(entry);
  } catch {
    // silent — activity logging should never break the app
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveStaffName(supabase: any, userId: string): Promise<string> {
  if (!userId) return "System";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: profile } = await sb
    .from("profiles")
    .select("name, email")
    .eq("id", userId)
    .single();

  if (profile?.name) return profile.name;
  if (profile?.email) return profile.email;

  const { data: staffUser } = await sb
    .from("staff_users")
    .select("email, role")
    .eq("user_id", userId)
    .single();

  if (staffUser?.email) return staffUser.email;

  return userId.slice(0, 8) + "…";
}
