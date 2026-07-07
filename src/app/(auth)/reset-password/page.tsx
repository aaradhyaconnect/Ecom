"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const supabase = createClient();
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          // User is in password recovery mode
        }
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        toast.error(error.message);
        return;
      }

      setSuccess(true);
      toast.success("Password updated successfully!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-ivory border border-ivory-dark/60 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-[1px] bg-gold/40 mx-auto mb-4" />
          <div className="w-12 h-12 bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Password Updated</h1>
          <p className="text-charcoal-muted text-sm mt-1">
            Your password has been successfully updated
          </p>
        </div>

        <Link href="/login">
          <Button fullWidth>Sign In with New Password</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-ivory border border-ivory-dark/60 p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-[1px] bg-gold/40 mx-auto mb-4" />
        <h1 className="text-2xl font-serif font-bold text-charcoal">Reset Password</h1>
        <p className="text-charcoal-muted text-sm mt-1">
          Enter your new password below
        </p>
      </div>

      {error && (
        <div className="bg-rose-50/50 border border-rose-200/60 p-4 mb-6 text-center">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-charcoal-muted hover:text-charcoal transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="h-4 w-4" />}
        />

        <div className="bg-ivory-dark/20 border border-ivory-dark/40 p-3 text-xs text-charcoal-muted space-y-1">
          <p className={password.length >= 8 ? "text-green-600" : ""}>✓ At least 8 characters</p>
          <p className={/[A-Z]/.test(password) ? "text-green-600" : ""}>✓ One uppercase letter</p>
          <p className={/[0-9]/.test(password) ? "text-green-600" : ""}>✓ One number</p>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Update Password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal-muted">
        <Link href="/login" className="font-medium text-charcoal hover:text-gold-dark transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
