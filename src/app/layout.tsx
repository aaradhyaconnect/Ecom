import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GoogleAnalytics, GoogleAnalyticsPageView } from "@/components/analytics/GoogleAnalytics";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFF0",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HAINJU | Premium Designer Clothing & Artificial Jewellery",
    template: "%s | HAINJU",
  },
  description:
    "Discover HAINJU's premium self-designed clothing and exquisite artificial jewellery. Elevate your style with our curated collections for the modern trendsetter.",
  keywords: [
    "designer clothing",
    "artificial jewellery",
    "fashion",
    "women clothing",
    "online shopping",
    "Indian fashion",
  ],
  authors: [{ name: "HAINJU" }],
  creator: "HAINJU",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://hainju.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "HAINJU",
    title: "HAINJU | Premium Designer Clothing & Artificial Jewellery",
    description:
      "Discover premium self-designed clothing and exquisite artificial jewellery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HAINJU",
    description: "Premium self-designed clothing and artificial jewellery by HAINJU.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-ivory text-charcoal">
        <GoogleAnalytics />
        <MicrosoftClarity />
        <Providers>
          <GoogleAnalyticsPageView />
          {children}
        </Providers>
      </body>
    </html>
  );
}
