"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/utils/sanitize";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirect"));
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (authMethod === "password") {
      if (!email || !password) {
        toast.error("Please fill in all fields");
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!data.success) {
          toast.error(data.error || "Login failed");
          setIsLoading(false);
          return;
        }
        if (data.data?.session) {
          const sessionRes = await fetch("/api/auth/set-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.data.session.access_token,
              refresh_token: data.data.session.refresh_token,
            }),
          }).catch(() => null);
          if (!sessionRes?.ok) {
            toast.error("Session setup failed. Please try again.");
            setIsLoading(false);
            return;
          }
        }
        toast.success("Welcome back!");
        window.location.replace(redirectTo);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    } else {
      const contact = otpChannel === "email" ? email : phone;
      if (!contact) {
        toast.error(otpChannel === "email" ? "Enter your email" : "Enter your phone number");
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(otpChannel === "email" ? { email } : { phone }),
        });
        const data = await res.json();
        if (!data.success) { toast.error(data.error); setIsLoading(false); return; }
        toast.success(data.message);
        router.push(otpChannel === "email" ? `/verify-otp?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}` : `/verify-otp?phone=${encodeURIComponent(phone)}&redirect=${encodeURIComponent(redirectTo)}`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}&popup=true`,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      if (data?.url) {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          data.url,
          "google-auth",
          `width=${width},height=${height},left=${left},top=${top}`
        );

        let handled = false;
        const cleanup = () => {
          window.removeEventListener("message", handleMessage);
          clearTimeout(pollTimer);
          cleanupRef.current = null;
        };
        cleanupRef.current = cleanup;

        const handleMessage = async (e: MessageEvent) => {
          if (e.origin !== window.location.origin) return;
          if (e.data?.type === "auth-callback" && e.data?.success && !handled) {
            handled = true;
            cleanup();
            if (!e.data.accessToken) {
              toast.error("Authentication failed. Please try again.");
              setIsLoading(false);
              return;
            }
            await supabase.auth.setSession({
              access_token: e.data.accessToken,
              refresh_token: e.data.refreshToken,
            });
            const sessionRes = await fetch("/api/auth/set-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                access_token: e.data.accessToken,
                refresh_token: e.data.refreshToken,
              }),
            }).catch(() => null);
            if (!sessionRes?.ok) {
              toast.error("Session setup failed. Please try again.");
              setIsLoading(false);
              return;
            }
            toast.success("Welcome back!");
            window.location.replace(e.data.path || redirectTo);
          }
        };

        window.addEventListener("message", handleMessage);

        const pollTimer = setTimeout(async () => {
          if (handled) return;
          cleanup();
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            handled = true;
            const sessionRes = await fetch("/api/auth/set-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            }).catch(() => null);
            if (!sessionRes?.ok) {
              toast.error("Session setup failed. Please try again.");
              setIsLoading(false);
              return;
            }
            toast.success("Welcome back!");
            window.location.replace(redirectTo);
          }
          setIsLoading(false);
        }, 30000);
      }
    } catch {
      toast.error("Failed to sign in with Google");
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-ivory-dark/40 p-6 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium">Welcome back</span>
        <h2 className="text-2xl font-serif font-bold text-charcoal mt-2">Sign In</h2>
        <p className="text-charcoal-muted text-sm mt-2">
          {authMethod === "password" ? "Enter your credentials to continue" : "Enter your phone or email to get OTP"}
        </p>
      </div>

      <div className="flex bg-ivory-dark/30 rounded-lg p-1 mb-6 sm:mb-8">
        <button
          onClick={() => setAuthMethod("password")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase rounded-md transition-all duration-200 ${
            authMethod === "password"
              ? "bg-white text-charcoal shadow-sm"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setAuthMethod("otp")}
          className={`flex-1 py-2.5 text-xs font-semibold tracking-[0.15em] uppercase rounded-md transition-all duration-200 ${
            authMethod === "otp"
              ? "bg-white text-charcoal shadow-sm"
              : "text-charcoal-muted hover:text-charcoal"
          }`}
        >
          OTP
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {authMethod === "password" ? (
          <>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-charcoal-muted hover:text-charcoal transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-dark transition-colors">
                Forgot password?
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex bg-ivory-dark/30 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setOtpChannel("email")}
                className={`flex-1 py-2 text-xs font-semibold tracking-[0.1em] uppercase rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  otpChannel === "email"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => setOtpChannel("phone")}
                className={`flex-1 py-2 text-xs font-semibold tracking-[0.1em] uppercase rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  otpChannel === "phone"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                <Phone className="h-3.5 w-3.5" /> Phone
              </button>
            </div>
            {otpChannel === "email" ? (
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
              />
            ) : (
              <Input
                label="Phone Number"
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="h-4 w-4" />}
              />
            )}
          </>
        )}

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          {authMethod === "password" ? "Sign In" : "Send OTP"}
        </Button>
      </form>

      <div className="relative my-6 sm:my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ivory-dark" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-[11px] uppercase tracking-[0.2em] text-charcoal-muted">or continue with</span>
        </div>
      </div>

      <Button type="button" variant="outline" fullWidth size="lg" isLoading={isLoading} onClick={handleGoogleLogin}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </Button>

      <p className="mt-6 sm:mt-8 text-center text-sm text-charcoal-muted">
        Don&apos;t have an account?{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-gold hover:text-gold-dark transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
