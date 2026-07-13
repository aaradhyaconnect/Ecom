"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Something went wrong</h2>
        <p style={{ color: "#666", marginBottom: "24px" }}>An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          style={{
            padding: "12px 24px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
