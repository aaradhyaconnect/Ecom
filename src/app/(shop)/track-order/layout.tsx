import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order | G2I Style",
  description: "Track your G2I Style order in real-time. Enter your order ID to see the current status, estimated delivery date, and tracking timeline.",
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
