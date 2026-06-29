"use client";

import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/constants/site";

export function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=Hi%20${SITE.name}!%20I%20have%20a%20question.`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 hover:shadow-xl transition-all duration-300 flex items-center justify-center animate-in fade-in zoom-in"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
