import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arcon Style",
    short_name: "Arcon Style",
    description: "Premium designer clothing & artificial jewellery",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFF0",
    theme_color: "#FFFFF0",
    orientation: "portrait",
    categories: ["shopping", "fashion"],
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
