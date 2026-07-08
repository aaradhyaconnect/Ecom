import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-8xl font-bold tracking-tighter text-charcoal">
        404
      </h1>
      <p className="mt-4 text-lg text-charcoal-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <p className="mt-1 text-sm text-charcoal-muted">
        Try searching our store or head back home.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="bg-charcoal px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-ivory hover:bg-charcoal-light transition-colors duration-300"
        >
          Go Home
        </Link>
        <Link
          href="/search"
          className="border border-ivory-dark px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-charcoal hover:border-gold/60 hover:text-gold-dark transition-colors duration-300"
        >
          Search Store
        </Link>
      </div>
    </div>
  );
}
