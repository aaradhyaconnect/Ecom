import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";

const staticRoutes = [
  { path: "/", priority: 1.0 },
  { path: "/products/women-clothing", priority: 0.9 },
  { path: "/products/artificial-jewellery", priority: 0.9 },
  { path: "/products/new-arrivals", priority: 0.9 },
  { path: "/products/best-sellers", priority: 0.8 },
  { path: "/products/sale", priority: 0.8 },
  { path: "/login", priority: 0.3 },
  { path: "/register", priority: 0.3 },
  { path: "/about", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/shipping", priority: 0.4 },
  { path: "/returns", priority: 0.4 },
  { path: "/faq", priority: 0.4 },
  { path: "/size-guide", priority: 0.4 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/careers", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${SITE.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.priority >= 0.8 ? "daily" : "monthly",
    priority: route.priority,
  }));
}
