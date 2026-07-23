"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Mail, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function SupplierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.data?.session) {
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
          setLoading(false);
          return;
        }

        toast.success("Login successful");
        window.location.replace("/supplier/dashboard");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        toast.success("Login link sent to your email");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to send login link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-charcoal text-white mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-light tracking-wider">SUPPLIER PORTAL</h1>
          <p className="text-sm text-charcoal-muted mt-1">Sign in to manage your orders</p>
        </div>

        {!sent ? (
          <>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-charcoal-muted mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
                  <Input
                    type="email"
                    placeholder="supplier@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-charcoal-muted mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email.trim() || !password.trim()}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ivory-dark/60" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-charcoal-muted">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSent(true)}
              className="w-full text-sm text-charcoal-muted hover:text-charcoal text-center py-2"
            >
              Sign in with email link instead
            </button>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-sm text-charcoal-muted mt-1">
                We sent a login link to <span className="font-medium">{email}</span>
              </p>
            </div>
            <p className="text-xs text-charcoal-muted">
              Click the link in the email to sign in. The link expires in 5 minutes.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm text-charcoal-muted hover:text-charcoal"
            >
              Use password instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
