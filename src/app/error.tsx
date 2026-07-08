"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-6xl font-bold tracking-tighter text-charcoal">
        Oops!
      </h1>
      <p className="mt-4 text-charcoal-muted">
        Something went wrong. Please try again.
      </p>
      <p className="mt-1 text-sm text-charcoal-muted">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="bg-charcoal px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-ivory hover:bg-charcoal-light transition-colors duration-300"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="border border-ivory-dark px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-charcoal hover:border-gold/60 hover:text-gold-dark transition-colors duration-300"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
