"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Package, Mail, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SupplierLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
          <form onSubmit={handleSendLink} className="space-y-4">
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
              {loading ? "Sending..." : "Send Login Link"}
            </Button>
          </form>
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
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
