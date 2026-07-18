import type { Metadata } from "next";
import { PrivacyClient } from "./privacy-client";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "G2I Style's privacy policy. Learn how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
