import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function SaleBanner() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-charcoal text-ivory overflow-hidden rounded-2xl">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=600&fit=crop"
              alt="Sale"
              fill
              sizes="100vw"
              className="object-cover opacity-30"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/60 to-transparent" />

          <div className="relative px-8 py-16 md:px-16 md:py-20">
            <span className="text-[10px] uppercase tracking-[0.5em] text-gold-light font-medium">
              Limited Time Offer
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mt-4 mb-3">
              Up to <span className="text-gold">50% Off</span>
            </h2>
            <p className="text-ivory/50 text-sm md:text-base max-w-md leading-relaxed mb-8">
              Don&apos;t miss out on our biggest sale of the season. Premium styles at irresistible prices.
            </p>
            <Link
              href="/products/sale"
              className="inline-flex items-center gap-2 bg-ivory text-charcoal px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-gold-light transition-colors duration-500 group"
            >
              Shop the Sale
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
