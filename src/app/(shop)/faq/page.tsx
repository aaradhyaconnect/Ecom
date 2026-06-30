"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "FAQ — HAINJU" };

const faqs = [
  {
    q: "How do I track my order?",
    a: "Once your order ships, you'll receive an email with a tracking number. You can also check your order status in your HAINJU account under Order History.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, UPI, net banking, and Cash on Delivery (COD) for orders up to ₹5,000.",
  },
  {
    q: "How long does delivery take?",
    a: "Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for ₹149. Same-day delivery is available in Mumbai for ₹299.",
  },
  {
    q: "Can I cancel my order?",
    a: "You can cancel your order within 24 hours of placing it. After that, the order may have already been dispatched. Contact us immediately if you need to cancel.",
  },
  {
    q: "What is your return policy?",
    a: "We offer hassle-free returns within 7 days of delivery. Items must be in original condition with tags attached. Refunds are processed within 5-7 business days.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently, we ship within India only. We're working on expanding to international locations soon.",
  },
  {
    q: "How do I know my size?",
    a: "Check our Size Guide for detailed measurements. Each product page also includes specific sizing information. If you're between sizes, we recommend sizing up.",
  },
  {
    q: "Are the jewellery pieces hypoallergenic?",
    a: "Our artificial jewellery is made with skin-friendly materials. However, if you have sensitive skin, we recommend checking the material details on each product page.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">Help Centre</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Frequently Asked Questions</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-ivory-dark">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-charcoal pr-4">{faq.q}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-charcoal-muted flex-shrink-0 transition-transform duration-300",
                  open === i && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                open === i ? "max-h-40" : "max-h-0"
              )}
            >
              <p className="px-5 pb-4 text-sm text-charcoal-muted leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
