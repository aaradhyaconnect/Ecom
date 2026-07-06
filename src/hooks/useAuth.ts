"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import type { User } from "@/types";

export function useAuth() {
  const { user, isAdmin, setUser, setIsAdmin, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (authUser && !error) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

          if (profile) {
            setUser(profile as User);
            setIsAdmin(profile.role === "admin");
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch {
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    getUser();

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
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
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
