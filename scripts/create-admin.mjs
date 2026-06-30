import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
    process.exit(1);
  }

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin";

  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.mjs <email> <password> [name]");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "admin" },
  });

  if (error) {
    console.error("Error creating user:", error.message);
    process.exit(1);
  }

  console.log("User created:", data.user.id);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", name })
    .eq("id", data.user.id);

  if (profileError) {
    console.error("Error updating profile:", profileError.message);
    process.exit(1);
  }

  console.log(`Admin "${name}" created successfully!`);
  console.log(`Email: ${email}`);
  console.log(`Login at: /admin/login`);
}

main().catch(console.error);
