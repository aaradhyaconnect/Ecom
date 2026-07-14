"use client";

import { useState, useEffect } from "react";
import { X, Truck, Tag, Sparkles, Clock } from "lucide-react";

const ANNOUNCEMENTS = [
  { icon: Truck, text: "Free Shipping On Orders Above ₹999" },
  { icon: Tag, text: "Use Code STYLE20 For 20% Off" },
  { icon: Sparkles, text: "New Collection Just Dropped" },
  { icon: Clock, text: "Limited Time — Buy 2 Get 1 Free" },
];

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--header-top",
      visible ? "36px" : "0px"
    );
    return () => document.documentElement.style.setProperty("--header-top", "0px");
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="bg-charcoal text-white relative overflow-hidden h-9 flex items-center z-50"
      style={{ position: "fixed", top: 0, left: 0, right: 0 }}
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mx-8 text-[11px] tracking-widest uppercase font-medium"
          >
            <item.icon className="h-3 w-3 shrink-0" />
            {item.text}
          </span>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Close announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
