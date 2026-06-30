"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail } from "lucide-react";
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
    <section className="py-24 md:py-32 bg-charcoal text-ivory relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(197,165,90,1) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-6">
          <Mail className="h-6 w-6 text-gold-light" />
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
          Join the <span className="gold-shimmer bg-clip-text text-transparent">&quot;HAINJU&quot; Circle</span>
        </h2>
        <p className="text-ivory/60 mb-10 max-w-md mx-auto leading-relaxed">
          Subscribe for exclusive access to new drops, style inspiration, and member-only offers.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm mx-auto">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="bg-ivory/5 border-ivory/10 text-ivory placeholder:text-ivory/30 focus:border-gold/40"
            required
          />
          <Button
            type="submit"
            variant="secondary"
            className="bg-gold text-charcoal hover:bg-gold-dark whitespace-nowrap font-medium tracking-wider text-xs uppercase"
            isLoading={isLoading}
          >
            Subscribe
          </Button>
        </form>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </section>
  );
}
