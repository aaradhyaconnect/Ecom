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
    bg: "bg-gradient-to-r from-stone-900 via-stone-800 to-stone-700",
  },
  {
    title: "Exquisite Jewellery",
    subtitle: "Artificial, Not Artificial",
    description: "Handpicked resale treasures that make a statement",
    cta: "Explore Collection",
    href: "/products/artificial-jewellery",
    bg: "bg-gradient-to-r from-amber-900 via-amber-800 to-stone-800",
  },
  {
    title: "Season's Sale",
    subtitle: "Up to 50% Off",
    description: "Limited time offers on premium fashion",
    cta: "Shop Sale",
    href: "/products/sale",
    bg: "bg-gradient-to-r from-rose-900 via-rose-800 to-stone-900",
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
    <section className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className={cn("absolute inset-0", slide.bg)} />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-lg text-white animate-in slide-up">
              <p className="text-sm uppercase tracking-[0.3em] mb-4 opacity-80">
                {slide.subtitle}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold leading-tight mb-4">
                {slide.title}
              </h1>
              <p className="text-base sm:text-lg opacity-80 mb-8">
                {slide.description}
              </p>
              <Link href={slide.href}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-black"
                >
                  {slide.cta}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors hidden sm:block"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition-colors hidden sm:block"
        aria-label="Next slide"
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === current ? "bg-white w-8" : "bg-white/40"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
