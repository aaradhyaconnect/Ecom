import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/lib/supabase/queries";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

const cachedGetProduct = cache(getProduct);

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let product: Product | null = null;
  try {
    product = await cachedGetProduct(slug);
  } catch {
    return { title: "Product Not Found" };
  }

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      url: `/product/${product.slug}`,
      siteName: "Arcon Style",
      images: product.images?.[0]
        ? [{ url: product.images[0], width: 1200, height: 630, alt: product.name }]
        : [],
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

function ProductJsonLd({ product }: { product: Product }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: { "@type": "Brand", name: "Arcon Style" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.rating > 0 && product.review_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.review_count,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

async function ProductContent({ slug }: { slug: string }) {
  let product: Product | null = null;
  try {
    product = await cachedGetProduct(slug);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  let relatedProducts: Product[] = [];
  try {
    relatedProducts = await getRelatedProducts(
      product.category,
      product.id,
      4
    );
  } catch {
    // Related products are optional, don't fail the page
  }

  return (
    <>
      <ProductJsonLd product={product} />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductContent slug={slug} />
    </Suspense>
  );
}
