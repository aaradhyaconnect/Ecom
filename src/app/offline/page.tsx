import Link from "next/link";
import { WifiOff, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-charcoal bg-ivory-dark">
          <WifiOff className="h-8 w-8 text-charcoal-muted" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-charcoal mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-charcoal-muted mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Please check your network and try again.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-charcoal text-ivory px-6 py-3 text-sm font-medium hover:bg-charcoal/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
