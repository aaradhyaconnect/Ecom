import type { Metadata } from "next";
import { ShippingClient } from "./shipping-client";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: "Arcon Style shipping policy — free shipping on orders above ₹999. Delivery across India.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return <ShippingClient />;
}
