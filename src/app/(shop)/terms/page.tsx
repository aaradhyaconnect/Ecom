import type { Metadata } from "next";
import { TermsClient } from "./terms-client";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "G2I Style's terms of service. Read our terms and conditions for using our website and services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <TermsClient />;
}
