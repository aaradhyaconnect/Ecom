import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: "HAINJU shipping policy — free shipping on orders above ₹999. Delivery across India.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">Information</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Shipping & Delivery</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">Processing Time</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
            If we experience a high volume of orders, shipments may be delayed by a few days. We will contact you if there
            is a significant delay.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">Shipping Rates</h2>
          <div className="overflow-hidden border border-ivory-dark">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ivory-dark text-left text-[10px] uppercase tracking-wider text-charcoal-muted">
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Estimated Time</th>
                  <th className="px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-ivory-dark">
                  <td className="px-4 py-3 text-charcoal">Standard Shipping</td>
                  <td className="px-4 py-3 text-charcoal-muted">5-7 business days</td>
                  <td className="px-4 py-3 text-charcoal">Free on orders above ₹999</td>
                </tr>
                <tr className="border-t border-ivory-dark">
                  <td className="px-4 py-3 text-charcoal">Express Shipping</td>
                  <td className="px-4 py-3 text-charcoal-muted">2-3 business days</td>
                  <td className="px-4 py-3 text-charcoal">₹149</td>
                </tr>
                <tr className="border-t border-ivory-dark">
                  <td className="px-4 py-3 text-charcoal">Same Day Delivery</td>
                  <td className="px-4 py-3 text-charcoal-muted">Within 24 hours</td>
                  <td className="px-4 py-3 text-charcoal">₹299 (Mumbai only)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">Tracking Your Order</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Once your order has shipped, you will receive an email with a tracking number. You can track your order
            through the carrier&apos;s website or by logging into your HAINJU account and viewing your order history.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-4">International Shipping</h2>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            Currently, we ship within India only. We are working on expanding our delivery network to serve
            international customers soon. Sign up for our newsletter to be the first to know when we launch
            international shipping.
          </p>
        </div>
      </div>
    </div>
  );
}
