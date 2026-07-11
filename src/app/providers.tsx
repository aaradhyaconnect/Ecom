"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/useAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/verify-otp") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");

  useAuth();

  return (
    <>
      <ToastProvider />
      {!isAdmin && !isAuth && <Header />}
      <main className={cn(!isAdmin && !isAuth && "pt-16 lg:pt-20 pb-16 lg:pb-0")}>
        {children}
      </main>
      {!isAdmin && !isAuth && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && !isAuth && <MobileNavigation />}
      <PwaInstallBanner />
    </>
  );
}
