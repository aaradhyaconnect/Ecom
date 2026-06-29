"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import type { User } from "@/types";

export function useAuth() {
  const { user, isAdmin, setUser, setIsAdmin, logout } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
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
        }
      } else {
        setUser(null);
        setIsAdmin(false);
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
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    logout();
    router.push("/");
  };

  return {
    user,
    isAdmin,
    isAuthenticated: !!user,
    signOut,
    setUser,
  };
}
