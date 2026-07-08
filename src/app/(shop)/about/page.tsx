import { SITE } from "@/lib/constants/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Arcon Style — premium self-designed clothing and artificial jewellery for the modern trendsetter.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">Our Story</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">About {SITE.name}</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      <div className="space-y-12 text-charcoal-muted">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg leading-relaxed">
            {SITE.name} is a premium self-designed clothing and artificial jewellery brand
            crafted for the modern trendsetter. We believe in creating unique pieces that
            help you express your individuality.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-serif font-bold text-gold-dark mb-2">100%</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-charcoal">Self-Designed</div>
            <p className="text-sm text-charcoal-muted mt-3">
              Every piece is thoughtfully designed by our in-house team, ensuring exclusivity and style.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-serif font-bold text-gold-dark mb-2">50K+</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-charcoal">Happy Customers</div>
            <p className="text-sm text-charcoal-muted mt-3">
              Trusted by thousands of fashion-forward individuals across India.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-serif font-bold text-gold-dark mb-2">Premium</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-charcoal">Quality Assured</div>
            <p className="text-sm text-charcoal-muted mt-3">
              We use only the finest materials and craftsmanship in every product.
            </p>
          </div>
        </div>

        <div className="bg-ivory-dark/50 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Our Mission</h2>
          <p className="text-sm leading-relaxed max-w-2xl mx-auto">
            To empower individuals with self-designed fashion that celebrates uniqueness. We are committed
            to delivering premium quality at accessible prices while maintaining ethical and sustainable
            business practices.
          </p>
        </div>
      </div>
    </div>
  );
}
