import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { Features } from "@/components/home/Features";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductSection } from "@/components/home/ProductSection";
import { SaleBanner } from "@/components/home/SaleBanner";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { getBanners } from "@/lib/supabase/queries";

export default async function HomePage() {
  let bannerSlides;
  try {
    const banners = await getBanners();
    bannerSlides = banners.map((b) => ({
      title: b.title,
      subtitle: b.subtitle || "",
      description: "",
      cta: "Shop Now",
      href: b.link || "/products/new-arrivals",
      image: b.image || undefined,
      accent: "from-amber-900/20",
    }));
  } catch {
    bannerSlides = undefined;
  }

  return (
    <>
      <HeroBanner initialSlides={bannerSlides} />
      <Features />
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh off the design desk"
        flag="is_new"
        viewAllHref="/products/new-arrivals"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-ivory-dark to-transparent" />
      </div>
      <CategoryShowcase />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-ivory-dark to-transparent" />
      </div>
      <ProductSection
        title="Best Sellers"
        subtitle="Loved by thousands"
        flag="is_best_seller"
        viewAllHref="/products/best-sellers"
      />
      <SaleBanner />
      <ProductSection
        title="Designer Collection"
        subtitle="Exclusive pieces for the modern trendsetter"
        category="women-clothing"
        viewAllHref="/products/women-clothing"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-ivory-dark to-transparent" />
      </div>
      <ProductSection
        title="Jewellery Collection"
        subtitle="Elevate every outfit"
        category="artificial-jewellery"
        viewAllHref="/products/artificial-jewellery"
      />
      <InstagramGallery />
      <CustomerReviews />
      <Newsletter />
    </>
  );
}
