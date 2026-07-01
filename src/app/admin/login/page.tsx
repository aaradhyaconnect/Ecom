"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Eye, EyeOff, Mail, Phone, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [otpMethod, setOtpMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!user) {
        toast.error("Login failed");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        toast.error("Unauthorized. Admin access required.");
        return;
      }
      toast.success("Welcome back!");
      window.location.href = "/admin";
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const contact = otpMethod === "email" ? email : phone;
    if (!contact) {
      toast.error(otpMethod === "email" ? "Enter your email" : "Enter your phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otpMethod === "email" ? { email } : { phone }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      toast.success(data.message);
      setOtpSent(true);
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const token = otp.join("");
    if (token.length !== 6) {
      toast.error("Enter the complete OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          otpMethod === "email" ? { email, token } : { phone, token }
        ),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return;
      }

      if (data.data.session) {
        await supabase.auth.setSession(data.data.session);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Login failed");
        await supabase.auth.signOut();
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        toast.error("Unauthorized. Admin access required.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Welcome back!");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-charcoal bg-ivory">
            <LayoutDashboard className="h-6 w-6 text-charcoal" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="mt-1 text-sm text-charcoal-muted">
            Sign in to manage your store
          </p>
        </div>

        <form
          onSubmit={method === "password" ? handlePasswordLogin : (e) => { e.preventDefault(); handleVerifyOTP(); }}
          className="space-y-4 bg-ivory border border-ivory-dark p-6"
        >
          <div className="flex gap-1 p-1 bg-charcoal/5 mb-2">
            <button
              type="button"
              onClick={() => setMethod("password")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                method === "password" ? "bg-ivory text-charcoal" : "text-charcoal-muted"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMethod("otp")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                method === "otp" ? "bg-ivory text-charcoal" : "text-charcoal-muted"
              }`}
            >
              OTP
            </button>
          </div>

          {method === "password" ? (
            <>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                icon={<Mail className="h-4 w-4" />}
                required
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-charcoal-muted/60 hover:text-charcoal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </>
          ) : !otpSent ? (
            <>
              <div className="flex gap-2 p-1 bg-charcoal/5">
                <button
                  type="button"
                  onClick={() => setOtpMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                    otpMethod === "email" ? "bg-ivory text-charcoal" : "text-charcoal-muted"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                    otpMethod === "phone" ? "bg-ivory text-charcoal" : "text-charcoal-muted"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" /> Phone
                </button>
              </div>
              {otpMethod === "email" ? (
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  icon={<Mail className="h-4 w-4" />}
                />
              ) : (
                <Input
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  icon={<Phone className="h-4 w-4" />}
                />
              )}
              <Button type="button" fullWidth isLoading={loading} onClick={handleSendOTP}>
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      if (!/^\d*$/.test(e.target.value)) return;
                      const newOtp = [...otp];
                      newOtp[index] = e.target.value.slice(-1);
                      setOtp(newOtp);
                      if (e.target.value && index < 5) {
                        const next = document.querySelector<HTMLInputElement>(
                          `input[name="otp-${index + 1}"]`
                        );
                        next?.focus();
                      }
                    }}
                    name={`otp-${index}`}
                    className="w-11 h-12 text-center text-lg font-semibold border border-ivory-dark bg-ivory"
                  />
                ))}
              </div>
              <Button type="button" fullWidth isLoading={loading} onClick={handleVerifyOTP}>
                Verify & Sign In
              </Button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); }}
                className="text-xs text-charcoal-muted hover:text-charcoal mx-auto block"
              >
                Change {otpMethod}
              </button>
            </>
          )}

          {method === "password" && (
            <Button type="submit" fullWidth isLoading={loading}>
              Sign In
            </Button>
          )}
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ivory-dark" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-ivory px-4 text-charcoal-muted/60">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          isLoading={loading}
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
