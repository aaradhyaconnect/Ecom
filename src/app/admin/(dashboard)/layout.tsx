import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { AdminSidebar } from "../_components/admin-sidebar";
import { AdminHeader } from "../_components/admin-header";
import { AdminMobileNav } from "../_components/admin-mobile-nav";
import type { User as UserType } from "@/types";

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

  if (authUser?.user_metadata?.role !== "admin") {
    redirect("/admin/login");
  }

  const user: UserType = {
    id: authUser.id as string as UserType["id"],
    email: authUser.email ?? "",
    name: authUser.user_metadata?.name ?? authUser.email?.split("@")[0] ?? "Admin",
    phone: authUser.phone ?? "",
    avatar_url: authUser.user_metadata?.avatar_url ?? undefined,
    role: "admin",
    created_at: authUser.created_at,
  };

  return (
    <div className="min-h-screen bg-ivory">
      <AdminSidebar />
      <AdminHeader user={user} />
      <main className="lg:pl-64 pt-16 pb-20 lg:pb-8">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
      <AdminMobileNav />
    </div>
  );
}
