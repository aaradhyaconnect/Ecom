"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import type { User } from "@/types";
import type { UUID } from "crypto";

export function useAuth() {
  const { user, setUser, setIsAdmin, setLoading, logout } = useAuthStore();
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;

    const supabase = createClient();

    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          setUser(null);
          setIsAdmin(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setUser(profile as User);
          setIsAdmin(profile.role === "admin");
        } else {
          setUser({
            id: authUser.id as UUID,
            email: authUser.email ?? "",
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
            phone: authUser.phone ?? undefined,
            avatar_url: authUser.user_metadata?.avatar_url ?? undefined,
            role: "customer",
            created_at: authUser.created_at ?? new Date().toISOString(),
          });
          setIsAdmin(false);
        }
      } catch {
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser(profile as User);
            setIsAdmin(profile.role === "admin");
          } else {
            setUser({
              id: session.user.id as UUID,
              email: session.user.email ?? "",
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User",
              phone: session.user.phone ?? undefined,
              avatar_url: session.user.user_metadata?.avatar_url ?? undefined,
              role: "customer",
              created_at: session.user.created_at ?? new Date().toISOString(),
            });
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/auth/set-session", { method: "DELETE" }).catch(() => {});
    logout();
    window.location.replace("/");
  };

  return {
    user,
    isAdmin: useAuthStore((s) => s.isAdmin),
    isAuthenticated: !!user,
    signOut,
    setUser,
  };
}
