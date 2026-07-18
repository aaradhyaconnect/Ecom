"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/Skeleton";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

const fallbackFaqs = [
  {
    q: "How do I track my order?",
    a: "Once your order ships, you'll receive an email with a tracking number. You can also check your order status in your G2I Style account under Order History.",
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

function FAQSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function FAQClient() {
  const [open, setOpen] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(fallbackFaqs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const sorted = [...json.data].sort(
            (a: FaqItem, b: FaqItem) => a.sort_order - b.sort_order
          );
          setFaqs(
            sorted.map((item: FaqItem) => ({
              q: item.question,
              a: item.answer,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FAQSkeleton />;

  return (
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
  );
}
