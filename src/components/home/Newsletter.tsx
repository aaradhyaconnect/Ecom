"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Mail, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscribed successfully!");
        setEmail("");
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative py-28 md:py-36 bg-charcoal text-ivory overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(197,165,90,1) 1px, transparent 0)`,
        backgroundSize: "32px 32px"
      }} />

      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(197,165,90,0.06) 0%, transparent 50%),
                         radial-gradient(ellipse at 80% 50%, rgba(232,213,163,0.04) 0%, transparent 50%)`
      }} />

      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16  bg-gold/5 border border-gold/15 mb-8">
          <Sparkles className="h-6 w-6 text-gold-light" />
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-5">
          Join the{" "}
          <span className="bg-gradient-to-r from-gold-light via-gold to-gold-light bg-clip-text text-transparent">
            HAINJU
          </span>{" "}
          Circle
        </h2>
        <p className="text-ivory/40 mb-12 max-w-md mx-auto leading-relaxed">
          Subscribe for exclusive access to new drops, style inspiration, and member-only offers.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm mx-auto">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/25" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-11 pr-4 py-4 bg-ivory/5 border border-ivory/10 text-ivory text-sm placeholder:text-ivory/25 focus:border-gold/40 focus:ring-0 outline-none transition-all duration-300 rounded-none"
              required
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="bg-gradient-to-r from-gold to-gold-dark text-charcoal hover:from-gold-dark hover:to-gold-dark whitespace-nowrap font-semibold tracking-[0.15em] text-[11px] uppercase px-8 py-4 rounded-none border-0"
            isLoading={isLoading}
          >
            Subscribe
          </Button>
        </form>
        <p className="text-ivory/20 text-[10px] mt-4 tracking-wider">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
