import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AdminHeader } from "./_components/admin-header";
import { AdminMobileNav } from "./_components/admin-mobile-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/admin/login");
  }

  const user = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    phone: profile.phone,
    avatar_url: profile.avatar_url,
    role: profile.role,
    created_at: profile.created_at,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <AdminHeader user={user} />
      <main className="lg:pl-64 pt-16 pb-20 lg:pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
      <AdminMobileNav />
    </div>
  );
}
