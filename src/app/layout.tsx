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
    default: "Arcon Style | Premium Designer Clothing & Artificial Jewellery",
    template: "%s | Arcon Style",
  },
  description:
    "Discover Arcon Style's premium self-designed clothing and exquisite artificial jewellery. Elevate your style with our curated collections for the modern trendsetter.",
  keywords: [
    "designer clothing",
    "artificial jewellery",
    "fashion",
    "women clothing",
    "online shopping",
    "Indian fashion",
  ],
  authors: [{ name: "Arcon Style" }],
  creator: "Arcon Style",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://arconstyle.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Arcon Style",
    title: "Arcon Style | Premium Designer Clothing & Artificial Jewellery",
    description:
      "Discover premium self-designed clothing and exquisite artificial jewellery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcon Style",
    description: "Premium self-designed clothing and artificial jewellery by Arcon Style.",
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-charcoal focus:text-white focus:px-4 focus:py-2 focus:rounded-sm focus:text-sm"
        >
          Skip to main content
        </a>
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
