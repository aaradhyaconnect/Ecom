"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/utils/sanitize";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirect"));
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");
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
      }

      toast.success("Verified successfully!");
      router.push(redirectTo);
      router.refresh();
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
    <div className="bg-ivory border border-ivory-dark p-8 animate-in slide-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-charcoal">
          {step === "input" ? "Sign in with OTP" : "Enter OTP"}
        </h1>
        <p className="text-charcoal-muted text-sm mt-1">
          {step === "input"
            ? "We&apos;ll send a one-time code to verify your identity"
            : `Enter the 6-digit code sent to ${contactLabel}`}
        </p>
      </div>

      {step === "input" ? (
        <div className="space-y-6">
          <div className="flex gap-2 p-1 bg-ivory-dark">
            <button
              onClick={() => setMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                method === "email"
                  ? "bg-ivory text-charcoal"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={() => setMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                method === "phone"
                  ? "bg-ivory text-charcoal"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4">
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
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="h-4 w-4" />}
              />
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Send OTP
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
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
                className="w-11 h-12 text-center text-lg font-semibold border border-ivory-dark focus:border-gold/60 outline-none bg-ivory"
              />
            ))}
          </div>

          <Button fullWidth isLoading={isLoading} onClick={handleVerifyOTP}>
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
        <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-charcoal hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
