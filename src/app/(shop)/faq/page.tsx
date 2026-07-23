import type { Metadata } from "next";
import { FAQClient } from "./faq-client";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Femme Drip — shipping, returns, payments, and more.",
  alternates: { canonical: "/faq" },
};

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">Help Centre</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Frequently Asked Questions</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>
      <FAQClient />
    </div>
  );
}
