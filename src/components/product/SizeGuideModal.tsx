"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SITE } from "@/lib/constants/site";
import { sanitizeHtml } from "@/lib/utils/sanitize";

const clothingSizes = [
  { size: "XS", chest: "32-34", waist: "26-28", hip: "34-36" },
  { size: "S", chest: "34-36", waist: "28-30", hip: "36-38" },
  { size: "M", chest: "36-38", waist: "30-32", hip: "38-40" },
  { size: "L", chest: "38-40", waist: "32-34", hip: "40-42" },
  { size: "XL", chest: "40-42", waist: "34-36", hip: "42-44" },
  { size: "XXL", chest: "42-44", waist: "36-38", hip: "44-46" },
];

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function FallbackContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-serif font-bold text-charcoal mb-3">Clothing Sizes (in inches)</h3>
        <div className="overflow-hidden border border-ivory-dark rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ivory-dark text-left text-[10px] uppercase tracking-wider text-charcoal-muted">
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Chest</th>
                <th className="px-3 py-2">Waist</th>
                <th className="px-3 py-2">Hip</th>
              </tr>
            </thead>
            <tbody>
              {clothingSizes.map((s) => (
                <tr key={s.size} className="border-t border-ivory-dark">
                  <td className="px-3 py-2 font-medium text-charcoal">{s.size}</td>
                  <td className="px-3 py-2 text-charcoal-muted">{s.chest}&quot;</td>
                  <td className="px-3 py-2 text-charcoal-muted">{s.waist}&quot;</td>
                  <td className="px-3 py-2 text-charcoal-muted">{s.hip}&quot;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-base font-serif font-bold text-charcoal mb-3">How to Measure</h3>
        <ul className="space-y-2 text-sm text-charcoal-muted">
          <li className="flex items-start gap-2">
            <span className="text-gold font-serif text-xs">01</span>
            <div><strong className="text-charcoal">Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-serif text-xs">02</span>
            <div><strong className="text-charcoal">Waist:</strong> Measure around your natural waistline, the narrowest part of your torso.</div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold font-serif text-xs">03</span>
            <div><strong className="text-charcoal">Hip:</strong> Measure around the fullest part of your hips, keeping the tape horizontal.</div>
          </li>
        </ul>
      </div>

      <div className="bg-ivory-dark/50 p-4 rounded-lg text-center">
        <p className="text-xs text-charcoal-muted">
          Still unsure? Contact us at{" "}
          <span className="text-gold-dark font-medium">{SITE.email}</span>
        </p>
      </div>
    </div>
  );
}

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/pages?slug=size-guide");
        const json = await r.json();
        if (!cancelled && json.success && json.data?.content) setContent(json.data.content);
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Size Guide" size="lg">
      {loading ? (
        <div className="py-8 text-center text-sm text-charcoal-muted">Loading size guide...</div>
      ) : content ? (
        <div
          className="prose prose-sm max-w-none text-charcoal-muted leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      ) : (
        <FallbackContent />
      )}
    </Modal>
  );
}
