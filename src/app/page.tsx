import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { Features } from "@/components/home/Features";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductSection } from "@/components/home/ProductSection";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <Features />
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh off the design desk"
        category="new-arrivals"
        viewAllHref="/products/new-arrivals"
      />
      <CategoryShowcase />
      <ProductSection
        title="Best Sellers"
        subtitle="Loved by thousands"
        category="best-sellers"
        viewAllHref="/products/best-sellers"
      />
      <ProductSection
        title="Sale"
        subtitle="Don't miss out on these deals"
        category="sale"
        viewAllHref="/products/sale"
      />
      <Newsletter />
    </>
  );
}
