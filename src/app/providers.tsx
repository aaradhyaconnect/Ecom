"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ToastProvider } from "@/components/ui/Toast";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/verify-otp");

  return (
    <>
      <ToastProvider />
      {!isAdmin && !isAuth && <Header />}
      <main className={cn(!isAdmin && !isAuth && "pt-16 lg:pt-20")}>
        {children}
      </main>
      {!isAdmin && !isAuth && <Footer />}
      {!isAdmin && <WhatsAppButton />}
    </>
  );
}
