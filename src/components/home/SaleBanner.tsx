import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SaleBanner() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-charcoal text-ivory overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold rounded-full translate-y-1/2 -translate-x-1/3" />
          </div>
          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            <span className="text-[10px] uppercase tracking-[0.5em] text-gold font-medium">
              Limited Time Offer
            </span>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mt-4 mb-2">
              Up to <span className="text-gold">50% Off</span>
            </h2>
            <p className="text-ivory/70 text-sm md:text-base max-w-md mx-auto mt-4 mb-8">
              Don&apos;t miss out on our biggest sale of the season. Premium styles at irresistible prices.
            </p>
            <Link
              href="/products/sale"
              className="inline-flex items-center gap-2 bg-gold text-charcoal px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-gold-light transition-colors duration-300 group"
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
