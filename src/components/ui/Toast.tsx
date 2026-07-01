"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1A1A1A",
          color: "#FFFFF0",
          padding: "12px 16px",
          fontSize: "14px",
        },
        success: {
          iconTheme: { primary: "#16a34a", secondary: "#FFFFF0" },
        },
        error: {
          iconTheme: { primary: "#e11d48", secondary: "#FFFFF0" },
        },
      }}
    />
  );
}
