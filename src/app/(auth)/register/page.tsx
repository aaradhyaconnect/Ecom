"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/utils/sanitize";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirect"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usePhone, setUsePhone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { toast.error("Please enter your name"); return; }
    if (!usePhone && !email) { toast.error("Please enter your email"); return; }
    if (usePhone && !phone) { toast.error("Please enter your phone number"); return; }
    if (!usePhone && password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!usePhone && !/[A-Z]/.test(password)) { toast.error("Password must contain at least one uppercase letter"); return; }
    if (!usePhone && !/[0-9]/.test(password)) { toast.error("Password must contain at least one number"); return; }

    setIsLoading(true);
    try {
      const supabase = createClient();

      if (usePhone) {
        const { error } = await supabase.auth.signInWithOtp({ phone, options: { data: { name } } });
        if (error) { toast.error(error.message); return; }
        toast.success("OTP sent! Verify to complete registration.");
        router.push(`/verify-otp?phone=${phone}&redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (authError) { toast.error(authError.message); return; }

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          email,
          name,
          phone: phone || null,
          role: "customer",
        });
        if (profileError) { toast.error(profileError.message); return; }
      }

      toast.success("Account created! Check your email to confirm.");
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleRegister() {
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
        };

        const handleMessage = async (e: MessageEvent) => {
          if (e.data?.type === "auth-callback" && e.data?.success && !handled) {
            handled = true;
            cleanup();
            if (e.data.accessToken) {
              await supabase.auth.setSession({
                access_token: e.data.accessToken,
                refresh_token: e.data.refreshToken,
              });
              await fetch("/api/auth/set-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  access_token: e.data.accessToken,
                  refresh_token: e.data.refreshToken,
                }),
              }).catch(() => {});
            }
            toast.success("Welcome to HAINJU!");
            window.location.replace(e.data.path || redirectTo);
          }
        };

        window.addEventListener("message", handleMessage);

        const pollTimer = setTimeout(async () => {
          if (handled) return;
          cleanup();
          setIsLoading(false);
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            handled = true;
            toast.success("Welcome to HAINJU!");
            window.location.replace(redirectTo);
          }
        }, 30000);
      }
    } catch {
      toast.error("Failed to sign up with Google");
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-ivory border border-ivory-dark p-8 animate-in slide-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-charcoal">Create Account</h1>
        <p className="text-charcoal-muted text-sm mt-1">Join HAINJU today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="h-4 w-4" />}
        />

        <div className="flex gap-1 p-1 bg-ivory-dark">
          <button
            type="button"
            onClick={() => setUsePhone(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
              !usePhone ? "bg-ivory text-charcoal" : "text-charcoal-muted"
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => setUsePhone(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
              usePhone ? "bg-ivory text-charcoal" : "text-charcoal-muted"
            }`}
          >
            <Phone className="h-3.5 w-3.5" /> Phone
          </button>
        </div>

        {usePhone ? (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="h-4 w-4" />}
          />
        ) : (
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-charcoal-muted/60 hover:text-charcoal transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}

        {!usePhone && (
          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="h-4 w-4" />}
          />
        )}

        <Button type="submit" fullWidth isLoading={isLoading}>
          {usePhone ? "Send OTP" : "Create Account"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ivory-dark" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-ivory px-4 text-charcoal-muted/60">or continue with</span>
        </div>
      </div>

      <Button type="button" variant="outline" fullWidth isLoading={isLoading} onClick={handleGoogleRegister}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </Button>

      <p className="mt-6 text-center text-sm text-charcoal-muted">
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-charcoal hover:text-gold-dark transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
