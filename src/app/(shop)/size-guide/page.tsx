import type { Metadata } from "next";
import { SizeGuideClient } from "./size-guide-client";

export const metadata: Metadata = {
  title: "Size Guide",
  description: "Find your perfect fit with Femme Drip's comprehensive size guide for clothing and jewellery.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  return <SizeGuideClient />;
}
