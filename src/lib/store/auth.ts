import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthStore {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      loading: true,
      setUser: (user) => set({ user }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, isAdmin: false, loading: false }),
    }),
    {
      name: "arconstyle-auth",
      partialize: (state) => ({
        user: state.user,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
