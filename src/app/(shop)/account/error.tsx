"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Account Error</h2>
        <p className="text-sm text-charcoal-muted mb-6">
          Something went wrong with your account. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-charcoal-muted mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <Button onClick={reset} variant="primary">
          Try Again
        </Button>
      </div>
    </div>
  );
}
