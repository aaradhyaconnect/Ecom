import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order | HAINJU",
  description: "Track your HAINJU order in real-time. Enter your order ID to see the current status, estimated delivery date, and tracking timeline.",
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
