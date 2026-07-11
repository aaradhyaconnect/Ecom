import type { Metadata } from "next";
import { ReturnsClient } from "./returns-client";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description: "Arcon Style return and exchange policy — easy returns within 7 days of delivery.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return <ReturnsClient />;
}
