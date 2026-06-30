import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/lib/supabase/queries";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let product: Product | null = null;
  try {
    product = await getProduct(slug);
  } catch {
    return { title: "Product Not Found" };
  }

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  let product: Product | null = null;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(
    product.category,
    product.id,
    4
  );

  return (
    <ProductDetailClient product={product} relatedProducts={relatedProducts} />
  );
}
