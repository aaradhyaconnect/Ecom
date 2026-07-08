import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description: "Arcon Style return and exchange policy — easy returns within 7 days of delivery.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">Policies</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Returns & Exchanges</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">Return Policy</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            We want you to love your purchase. If you&apos;re not completely satisfied, we accept returns within
            7 days of delivery for a full refund or exchange. Items must be in their original condition with
            all tags attached.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">How to Return</h2>
          <ol className="space-y-3 text-sm text-charcoal-muted list-decimal list-inside">
            <li>Log into your Arcon Style account and go to Order History</li>
            <li>Select the order containing the item you wish to return</li>
            <li>Click &quot;Return Item&quot; and select your reason</li>
            <li>Print the prepaid return shipping label</li>
            <li>Pack the item securely and drop off at your nearest courier point</li>
            <li>Refund will be processed within 5-7 business days of receiving the return</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">Eligible Items</h2>
          <ul className="space-y-2 text-sm text-charcoal-muted">
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">✓</span>
              Clothing items with tags attached and unworn
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">✓</span>
              Jewellery in original packaging
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold mt-0.5">✓</span>
              Items purchased within the last 7 days
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">Non-Returnable Items</h2>
          <ul className="space-y-2 text-sm text-charcoal-muted">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">✕</span>
              Items without original tags
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">✕</span>
              Worn, washed, or altered items
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">✕</span>
              Items purchased during final sale
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">Exchanges</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            We offer free exchanges for different sizes or colors within 7 days of delivery. If the desired
            variant is unavailable, we will process a full refund instead.
          </p>
        </div>
      </div>
    </div>
  );
}
