import type { Metadata } from "next";
import { AboutClient } from "./about-client";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about G2I Style — premium self-designed clothing and artificial jewellery for the modern trendsetter.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutClient />;
}
