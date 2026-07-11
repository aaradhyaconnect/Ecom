"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/constants/site";
import { Skeleton } from "@/components/ui/Skeleton";

interface PageData {
  slug: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

function TermsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <Skeleton className="h-3 w-16 mx-auto mb-4" />
        <Skeleton className="h-12 w-72 mx-auto" />
        <Skeleton className="h-[1px] w-12 mx-auto mt-6" />
      </div>
      <div className="space-y-8">
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FallbackContent() {
  return (
    <div className="prose max-w-none space-y-8 text-sm text-charcoal-muted leading-relaxed">
      <p>Last updated: January 2026</p>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Acceptance of Terms</h2>
        <p>By accessing or using the {SITE.name} website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Account Registration</h2>
        <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Products and Pricing</h2>
        <p>All product descriptions, images, and prices are subject to change without notice. We reserve the right to modify or discontinue any product at any time. Prices are inclusive of applicable taxes unless stated otherwise.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Orders and Payment</h2>
        <p>By placing an order, you offer to purchase the product at the listed price. We reserve the right to accept or decline any order. Payment must be received in full before order processing.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Shipping and Delivery</h2>
        <p>Delivery times are estimates and may vary. {SITE.name} is not responsible for delays caused by shipping carriers or unforeseen circumstances. Risk of loss passes to you upon delivery.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Returns and Refunds</h2>
        <p>Items may be returned within 7 days of delivery in original condition. Refunds are processed within 5-7 business days of receiving the returned item. Please refer to our Returns & Exchanges page for details.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Intellectual Property</h2>
        <p>All content on this website, including designs, logos, and text, is the property of {SITE.name} and is protected by copyright laws. Unauthorized use is prohibited.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Limitation of Liability</h2>
        <p>{SITE.name} shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
      </section>

      <section>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-3">Contact Us</h2>
        <p>For questions about these Terms, please contact us at {SITE.email}.</p>
      </section>
    </div>
  );
}

export function TermsClient() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pages?slug=terms")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.content) {
          setPageData(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <TermsSkeleton />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">Legal</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">
          {pageData?.title || "Terms of Service"}
        </h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      {pageData?.content ? (
        <div
          className="prose max-w-none text-sm text-charcoal-muted leading-relaxed"
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      ) : (
        <FallbackContent />
      )}
    </div>
  );
}
