import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants/site";
import { createPublicClient } from "@/lib/supabase/server";

const staticRoutes = [
  { path: "/", priority: 1.0 },
  { path: "/products/women-clothing", priority: 0.9 },
  { path: "/products/artificial-jewellery", priority: 0.9 },
  { path: "/products/new-arrivals", priority: 0.9 },
  { path: "/products/best-sellers", priority: 0.8 },
  { path: "/products/sale", priority: 0.8 },
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

async function getProductSlugs(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createPublicClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (!products) return [];

    return products.map((product) => ({
      url: `${SITE.url}/product/${product.slug}`,
      lastModified: new Date(product.updated_at || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productRoutes = await getProductSlugs();

  const staticSitemap: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.priority >= 0.8 ? ("daily" as const) : ("monthly" as const),
    priority: route.priority,
  }));

  return [...staticSitemap, ...productRoutes];
}
