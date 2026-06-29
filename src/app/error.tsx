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
      <h1 className="font-serif text-6xl font-bold tracking-tighter text-gray-900">
        Oops!
      </h1>
      <p className="mt-4 text-gray-500">
        Something went wrong. Please try again.
      </p>
      <p className="mt-1 text-sm text-gray-400">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-full border border-gray-200 px-8 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
