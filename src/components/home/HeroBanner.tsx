"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

const slides = [
  {
    title: "Elevate Your Style",
    subtitle: "Self-Designed Clothing Collection",
    description: "Unique pieces crafted for the modern trendsetter",
    cta: "Shop Now",
    href: "/products/new-arrivals",
    bg: "from-charcoal via-charcoal-light to-charcoal",
    pattern: "radial-gradient(circle at 20% 50%, rgba(197,165,90,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,240,0.03) 0%, transparent 50%)",
  },
  {
    title: "Exquisite Jewellery",
    subtitle: "Artificial, Not Artificial",
    description: "Handpicked resale treasures that make a statement",
    cta: "Explore Collection",
    href: "/products/artificial-jewellery",
    bg: "from-gold-dark via-charcoal-light to-charcoal",
    pattern: "radial-gradient(circle at 30% 60%, rgba(197,165,90,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(232,213,163,0.06) 0%, transparent 50%)",
  },
  {
    title: "Season's Sale",
    subtitle: "Up to 50% Off",
    description: "Limited time offers on premium fashion & jewellery",
    cta: "Shop Sale",
    href: "/products/sale",
    bg: "from-charcoal via-gold-dark/40 to-charcoal-light",
    pattern: "radial-gradient(circle at 50% 80%, rgba(197,165,90,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(232,213,163,0.05) 0%, transparent 50%)",
  },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative h-[80vh] min-h-[550px] max-h-[900px] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-out",
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br" style={{ backgroundImage: slide.pattern }} />
          <div className={cn("absolute inset-0 bg-gradient-to-br", slide.bg)} />
          <div className="absolute inset-0 bg-charcoal/30" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div key={current} className="max-w-xl text-ivory">
              <div className="animate-in slide-up" style={{ animationDelay: "0ms" }}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-[1px] w-12 bg-gold/60" />
                  <span className="text-xs uppercase tracking-[0.3em] text-gold-light font-medium">
                    {slide.subtitle}
                  </span>
                </div>
              </div>
              <h1 className="animate-in slide-up text-4xl sm:text-5xl lg:text-7xl font-serif font-bold leading-tight mb-6 text-ivory" style={{ animationDelay: "150ms" }}>
                {slide.title}
              </h1>
              <p className="animate-in slide-up text-base sm:text-lg text-ivory/70 mb-10 max-w-md leading-relaxed" style={{ animationDelay: "300ms" }}>
                {slide.description}
              </p>
              <div className="animate-in slide-up" style={{ animationDelay: "450ms" }}>
                <Link href={slide.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gold/60 text-gold-light hover:bg-gold/10 hover:border-gold transition-all duration-300 tracking-wider uppercase text-xs"
                  >
                    {slide.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ivory to-transparent" />
        </div>
      ))}

      <button
        onClick={prev}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-ivory/40 hover:text-ivory transition-all duration-300 hover:scale-110 hidden sm:block z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-ivory/40 hover:text-ivory transition-all duration-300 hover:scale-110 hidden sm:block z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "rounded-full transition-all duration-500",
              i === current ? "w-12 h-1.5 bg-gold" : "w-3 h-1.5 bg-ivory/30 hover:bg-ivory/50"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
