"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BannerSlide {
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  href: string;
  image?: string;
  accent: string;
}

const fallbackSlides: BannerSlide[] = [
  {
    title: "Elevate Your Style",
    subtitle: "Self-Designed Clothing Collection",
    description: "Unique pieces crafted for the modern trendsetter",
    cta: "Shop Now",
    href: "/products/new-arrivals",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1400&h=800&fit=crop",
    accent: "from-amber-900/20",
  },
  {
    title: "Exquisite Jewellery",
    subtitle: "Curated Resale Treasures",
    description: "Handpicked statement pieces that define elegance",
    cta: "Explore Collection",
    href: "/products/artificial-jewellery",
    image: "https://images.unsplash.com/photo-1515562141589-67f0d727b750?w=1400&h=800&fit=crop",
    accent: "from-rose-900/10",
  },
  {
    title: "Season's Sale",
    subtitle: "Up to 50% Off",
    description: "Limited time offers on premium fashion & jewellery",
    cta: "Shop Sale",
    href: "/products/sale",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&h=800&fit=crop",
    accent: "from-emerald-900/10",
  },
];

export function HeroBanner({ initialSlides }: { initialSlides?: BannerSlide[] }) {
  const slides = initialSlides && initialSlides.length > 0 ? initialSlides : fallbackSlides;
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setAnimKey((k) => k + 1);
  }, []);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => {
        setAnimKey((k) => k + 1);
        return (c + 1) % slides.length;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current];

  return (
    <section className="relative h-[85vh] min-h-[600px] max-h-[950px] overflow-hidden bg-charcoal">
      {slides.map((s, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1200ms] ease-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          )}
        >
          {s.image ? (
            <div className="absolute inset-0">
              <Image
                src={s.image}
                alt={s.title}
                fill
                sizes="100vw"
                className="object-cover"
                preload={i === 0}
              />
              <div className="absolute inset-0 bg-charcoal/60" />
            </div>
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal", s.accent)} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-charcoal/20" />
        </div>
      ))}

      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center">
        <div className="max-w-2xl" key={animKey}>
          <div className="animate-in slide-up" style={{ animationDuration: "600ms" }}>
            <div className="flex items-center gap-4 mb-8">
              <span className="h-[1px] w-16 bg-gradient-to-r from-gold to-gold/0" />
              <span className="text-[11px] uppercase tracking-[0.4em] text-gold-light font-medium">
                {slide.subtitle}
              </span>
            </div>
          </div>

          <h1
            className="animate-in slide-up text-5xl sm:text-6xl lg:text-[4.5rem] font-serif font-bold leading-[1.1] mb-8 text-ivory"
            style={{ animationDelay: "100ms", animationDuration: "600ms" }}
          >
            {slide.title.split(" ").map((word, wi) => (
              <span key={wi}>
                {wi === 1 ? (
                  <span className="bg-gradient-to-r from-gold-light via-gold to-gold-light bg-clip-text text-transparent">{word} </span>
                ) : (
                  <>{word} </>
                )}
              </span>
            ))}
          </h1>

          <p
            className="animate-in slide-up text-lg sm:text-xl text-ivory/50 mb-12 max-w-lg leading-relaxed font-light"
            style={{ animationDelay: "250ms", animationDuration: "600ms" }}
          >
            {slide.description}
          </p>

          <div className="animate-in slide-up flex items-center gap-6" style={{ animationDelay: "400ms", animationDuration: "600ms" }}>
            <Link
              href={slide.href}
              className="group relative inline-flex items-center gap-3 px-10 py-4 bg-ivory text-charcoal text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gold-light transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10">{slide.cta}</span>
              <span className="absolute inset-0 bg-gradient-to-r from-gold to-gold-dark translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-2 text-ivory/30 text-xs uppercase tracking-wider">
              <span className="w-8 h-[1px] bg-ivory/15" />
              Scroll to explore
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ivory via-ivory/50 to-transparent z-10" />

      <button
        onClick={prev}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 p-3 text-ivory/30 hover:text-ivory transition-all duration-300 hover:scale-110 hidden sm:block group"
        aria-label="Previous slide"
      >
        <div className="w-12 h-12 border border-ivory/10 flex items-center justify-center group-hover:border-gold/40 group-hover:bg-gold/5 transition-all duration-300">
          <ChevronLeft className="h-5 w-5" />
        </div>
      </button>
      <button
        onClick={next}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 p-3 text-ivory/30 hover:text-ivory transition-all duration-300 hover:scale-110 hidden sm:block group"
        aria-label="Next slide"
      >
        <div className="w-12 h-12 border border-ivory/10 flex items-center justify-center group-hover:border-gold/40 group-hover:bg-gold/5 transition-all duration-300">
          <ChevronRight className="h-5 w-5" />
        </div>
      </button>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              "transition-all duration-700 ease-out",
              i === current
                ? "w-14 h-[2px] bg-gold"
                : "w-4 h-[2px] bg-ivory/20 hover:bg-ivory/40"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
