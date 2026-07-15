let cachedValue: boolean = false;
let lastCheck = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck < CACHE_TTL) {
    return cachedValue;
  }
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase.from("store_settings").select("maintenance_mode").limit(1).single();
    cachedValue = data?.maintenance_mode ?? false;
    lastCheck = now;
  } catch {
    cachedValue = false;
  }
  return cachedValue;
}
