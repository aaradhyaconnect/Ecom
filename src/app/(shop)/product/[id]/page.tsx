import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { getRelatedProducts } from "@/lib/supabase/queries";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .or(`slug.eq.${id},id.eq.${id}`)
    .maybeSingle();
  return data as Product | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

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
  const { id } = await params;
  const product = await getProduct(id);

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
