import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-5f274d699fd14be18a8456b06f1732ec.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-bfd52c501031474e9474ff3c3b7e3ca5.r2.dev",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://js.razorpay.com https://checkout.razorpay.com https://accounts.google.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://pub-5f274d699fd14be18a8456b06f1732ec.r2.dev https://pub-bfd52c501031474e9474ff3c3b7e3ca5.r2.dev https://images.unsplash.com https://lh3.googleusercontent.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://sqknikmhacxvugkmfqgd.supabase.co https://api.razorpay.com https://apiv2.shiprocket.in https://www.google-analytics.com https://www.clarity.ms https://*.sentry.io",
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
  tunnelRoute: "/api/sentry",
});
