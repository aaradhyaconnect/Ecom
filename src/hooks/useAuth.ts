"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth";
import type { User } from "@/types";

export function useAuth() {
  const { setUser, setIsAdmin, setLoading, logout } = useAuthStore();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user as User);
            setIsAdmin(data.user.role === "admin");
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
        if (!cancelled) {
          done.current = true;
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => {});
    await fetch("/api/auth/set-session", { method: "DELETE" }).catch(() => {});
    logout();
    window.location.replace("/");
  };

  const isAdmin = useAuthStore((s) => s.isAdmin);
  const user = useAuthStore((s) => s.user);

  return {
    user,
    isAdmin,
    isAuthenticated: !!user,
    signOut,
    setUser,
  };
}
