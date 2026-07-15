"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Password reset email sent!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-ivory-dark/40 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-100 flex items-center justify-center mx-auto mb-4 rounded-full">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Check Your Email</h1>
          <p className="text-charcoal-muted text-sm mt-2">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <div className="bg-ivory-dark/20 border border-ivory-dark/40 p-4 rounded-lg mb-6 text-center">
          <p className="text-sm text-charcoal-muted">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
        </div>

        <Button variant="outline" fullWidth size="lg" onClick={() => setSent(false)}>
          Try Again
        </Button>

        <p className="mt-6 text-center text-sm text-charcoal-muted">
          <Link href="/login" className="font-medium text-charcoal hover:text-gold-dark transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-ivory-dark/40 p-6 sm:p-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-ivory-dark/30 flex items-center justify-center mx-auto mb-4 rounded-full">
          <Mail className="h-6 w-6 text-charcoal-muted" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-charcoal">Forgot Password?</h1>
        <p className="text-charcoal-muted text-sm mt-2">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
        />

        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal-muted">
        <Link href="/login" className="font-medium text-charcoal hover:text-gold-dark transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </p>
    </div>
  );
}
