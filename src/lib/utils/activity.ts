import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function logActivity(
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
  userId?: string
) {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("activity_logs").insert({
      user_id: userId || null,
      action,
      entity,
      entity_id: entityId || null,
      details: details || {},
    });
  } catch {
    // silent — activity logging should never break the app
  }
}
