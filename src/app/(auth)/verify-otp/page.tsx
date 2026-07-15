"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/utils/sanitize";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirect"));
  const urlEmail = searchParams.get("email") || "";
  const urlPhone = searchParams.get("phone") || "";
  const urlMethod = urlPhone ? "phone" : urlEmail ? "email" : "email";
  const [method, setMethod] = useState<"email" | "phone">(urlMethod as "email" | "phone");
  const [email, setEmail] = useState(urlEmail);
  const [phone, setPhone] = useState(urlPhone);
  const [step, setStep] = useState<"input" | "otp">(urlEmail || urlPhone ? "otp" : "input");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (method === "email" && !email) {
      toast.error("Please enter your email");
      return;
    }
    if (method === "phone" && !phone) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(method === "email" ? { email } : { phone }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message);
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP() {
    const token = otp.join("");
    if (token.length !== 6) {
      toast.error("Please enter the complete OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          method === "email" ? { email, token } : { phone, token }
        ),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      const supabase = createClient();
      if (data.data.session) {
        await supabase.auth.setSession(data.data.session);
        const setRes = await fetch("/api/auth/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.data.session.access_token,
            refresh_token: data.data.session.refresh_token,
          }),
        }).catch(() => null);
        if (!setRes?.ok) toast.error("Session setup failed. Please refresh.");
      }

      toast.success("Verified successfully!");
      window.location.replace(redirectTo);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  }

  const contactLabel = method === "email" ? email : phone;

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-ivory-dark/40 p-6 sm:p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-ivory-dark/30 flex items-center justify-center mx-auto mb-4 rounded-full">
          {step === "input" ? (
            <Mail className="h-6 w-6 text-charcoal-muted" />
          ) : (
            <span className="text-lg font-bold text-charcoal">{otp.filter(Boolean).length}/6</span>
          )}
        </div>
        <h1 className="text-2xl font-serif font-bold text-charcoal">
          {step === "input" ? "Sign in with OTP" : "Enter OTP"}
        </h1>
        <p className="text-charcoal-muted text-sm mt-2">
          {step === "input"
            ? "We\u2019ll send a one-time code to verify your identity"
            : `Enter the 6-digit code sent to ${contactLabel}`}
        </p>
      </div>

      {step === "input" ? (
        <div className="space-y-5">
          <div className="flex bg-ivory-dark/30 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-[0.1em] uppercase rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                method === "email"
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-[0.1em] uppercase rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 ${
                method === "phone"
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              <Phone className="h-3.5 w-3.5" /> Phone
            </button>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-5">
            {method === "email" ? (
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

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Send OTP
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-11 h-12 text-center text-lg font-semibold border border-ivory-dark rounded-lg focus:border-gold/60 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] outline-none bg-ivory transition-all"
              />
            ))}
          </div>

          <Button fullWidth isLoading={isLoading} size="lg" onClick={handleVerifyOTP}>
            Verify OTP
          </Button>

          <button
            type="button"
            onClick={() => { setStep("input"); setOtp(["", "", "", "", "", ""]); }}
            className="flex items-center justify-center gap-1 text-sm text-charcoal-muted hover:text-charcoal transition-colors mx-auto"
          >
            <ArrowLeft className="h-3 w-3" />
            Change {method}
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-charcoal-muted">
        <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-charcoal hover:text-gold-dark transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </p>
    </div>
  );
}
