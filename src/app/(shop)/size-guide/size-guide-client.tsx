"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/constants/site";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { Skeleton } from "@/components/ui/Skeleton";

interface PageData {
  slug: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

const clothingSizes = [
  { size: "XS", chest: "32-34", waist: "26-28", hip: "34-36" },
  { size: "S", chest: "34-36", waist: "28-30", hip: "36-38" },
  { size: "M", chest: "36-38", waist: "30-32", hip: "38-40" },
  { size: "L", chest: "38-40", waist: "32-34", hip: "40-42" },
  { size: "XL", chest: "40-42", waist: "34-36", hip: "42-44" },
  { size: "XXL", chest: "42-44", waist: "36-38", hip: "44-46" },
];

function SizeGuideSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <Skeleton className="h-3 w-28 mx-auto mb-4" />
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-[1px] w-12 mx-auto mt-6" />
      </div>
      <div className="space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FallbackContent() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-6">Clothing Sizes (in inches)</h2>
        <div className="overflow-hidden border border-ivory-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ivory-dark text-left text-[10px] uppercase tracking-wider text-charcoal-muted">
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Chest</th>
                <th className="px-4 py-3">Waist</th>
                <th className="px-4 py-3">Hip</th>
              </tr>
            </thead>
            <tbody>
              {clothingSizes.map((s) => (
                <tr key={s.size} className="border-t border-ivory-dark">
                  <td className="px-4 py-3 font-medium text-charcoal">{s.size}</td>
                  <td className="px-4 py-3 text-charcoal-muted">{s.chest}&quot;</td>
                  <td className="px-4 py-3 text-charcoal-muted">{s.waist}&quot;</td>
                  <td className="px-4 py-3 text-charcoal-muted">{s.hip}&quot;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-4">How to Measure</h2>
        <ul className="space-y-3 text-sm text-charcoal-muted">
          <li className="flex items-start gap-3">
            <span className="text-gold font-serif">01</span>
            <div>
              <strong className="text-charcoal">Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-gold font-serif">02</span>
            <div>
              <strong className="text-charcoal">Waist:</strong> Measure around your natural waistline, the narrowest part of your torso.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-gold font-serif">03</span>
            <div>
              <strong className="text-charcoal">Hip:</strong> Measure around the fullest part of your hips, keeping the tape horizontal.
            </div>
          </li>
        </ul>
      </div>

      <div className="bg-ivory-dark/50 p-6 text-center">
        <p className="text-sm text-charcoal-muted">
          Still unsure about your size? Contact us at{" "}
          <span className="text-gold-dark font-medium">{SITE.email}</span> and our style team will help you find the perfect fit.
        </p>
      </div>
    </div>
  );
}

export function SizeGuideClient() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pages?slug=size-guide")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.content) {
          setPageData(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SizeGuideSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">Reference</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">
          {pageData?.title || "Size Guide"}
        </h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      {pageData?.content ? (
        <div
          className="prose max-w-none text-sm text-charcoal-muted leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(pageData.content) }}
        />
      ) : (
        <FallbackContent />
      )}
    </div>
  );
}
