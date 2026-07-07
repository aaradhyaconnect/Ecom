import { SITE } from "@/lib/constants/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "HAINJU's privacy policy. Learn how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">Legal</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Privacy Policy</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      <div className="prose max-w-none space-y-8 text-sm text-charcoal-muted leading-relaxed">
        <p>Last updated: January 2026</p>

        <section>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, phone number, shipping address, and payment information when you create an account, make a purchase, or contact us.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-3">How We Use Your Information</h2>
          <p>We use your information to process orders, send order updates, provide customer support, send marketing communications (with your consent), and improve our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Information Sharing</h2>
          <p>We do not sell your personal information. We may share your data with trusted third parties who assist in operating our website, processing payments, and delivering orders, subject to confidentiality agreements.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Cookies</h2>
          <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at {SITE.email}.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Contact Us</h2>
          <p>For privacy-related inquiries, please contact us at {SITE.email}.</p>
        </section>
      </div>
    </div>
  );
}
