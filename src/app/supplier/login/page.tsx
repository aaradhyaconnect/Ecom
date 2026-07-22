"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Mail, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

export default function SupplierLoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
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
        setOtpSent(true);
        toast.success("OTP sent to your email");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp }),
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
        toast.error(data.error);
      }
    } catch {
      toast.error("Login failed");
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

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? "Sending..." : "Send OTP Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-charcoal-muted mb-1 block">OTP Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-muted" />
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="pl-10"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-charcoal-muted mt-1">Sent to {email}</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length < 4}>
              {loading ? "Verifying..." : "Sign In"}
            </Button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(""); }}
              className="w-full text-sm text-charcoal-muted hover:text-charcoal text-center"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
