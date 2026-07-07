"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import type { User } from "@/types";
import type { UUID } from "crypto";

export function useAuth() {
  const { user, isAdmin, setUser, setIsAdmin, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const applyProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        setUser(profile as User);
        setIsAdmin(profile.role === "admin");
      } else {
        const authUser = (await supabase.auth.getUser()).data.user;
        if (authUser) {
          const fallback: User = {
            id: authUser.id as UUID,
            email: authUser.email ?? "",
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
            phone: authUser.phone ?? undefined,
            avatar_url: authUser.user_metadata?.avatar_url ?? undefined,
            role: "customer",
            created_at: authUser.created_at ?? new Date().toISOString(),
          };
          setUser(fallback);
          setIsAdmin(false);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
    };

    const getUser = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (authUser && !error) {
          await applyProfile(authUser.id);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch {
        setUser(null);
        setIsAdmin(false);
      } finally {
        if (!settled) {
          settled = true;
          setLoading(false);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await applyProfile(session.user.id);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        if (!settled) {
          settled = true;
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/set-session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
    logout();
    window.location.replace("/");
  };

  return {
    user,
    isAdmin,
    isAuthenticated: !!user,
    signOut,
    setUser,
  };
}
