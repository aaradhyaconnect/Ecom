import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./_components/dashboard-client";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/admin/login");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/analytics`,
    { cache: "no-store" }
  );
  const analyticsData = await res.json();

  const ordersRes = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/orders?limit=10`,
    { cache: "no-store" }
  );
  const ordersData = await ordersRes.json();

  return (
    <DashboardClient
      analytics={analyticsData.data}
      recentOrders={ordersData.data || []}
    />
  );
}
