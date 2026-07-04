import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    title: "Summer Edit",
    subtitle: "Light fabrics for warm days",
    href: "/products/new-arrivals",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop",
    size: "large",
  },
  {
    title: "Wedding Collection",
    subtitle: "Make a statement",
    href: "/products/artificial-jewellery",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=750&fit=crop",
    size: "small",
  },
  {
    title: "Office Wear",
    subtitle: "Professional elegance",
    href: "/products/women-clothing",
    image: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=750&fit=crop",
    size: "small",
  },
];

export function EditorialCollection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-[1px] w-8 bg-gold/40" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
              Curated for You
            </span>
            <span className="h-[1px] w-8 bg-gold/40" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Editorial
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <Link
            href={collections[0].href}
            className="group relative overflow-hidden bg-beige rounded-xl md:row-span-2"
          >
            <div className="relative aspect-[3/4] md:aspect-auto md:h-full">
              <Image
                src={collections[0].image}
                alt={collections[0].title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light mb-2">
                  {collections[0].subtitle}
                </p>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-ivory mb-3">
                  {collections[0].title}
                </h3>
                <div className="flex items-center gap-2 text-ivory/70 group-hover:text-ivory transition-colors duration-500">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                    Explore
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>

          {collections.slice(1).map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              className="group relative overflow-hidden bg-beige rounded-xl"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light mb-1.5">
                    {collection.subtitle}
                  </p>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-ivory mb-2">
                    {collection.title}
                  </h3>
                  <div className="flex items-center gap-2 text-ivory/70 group-hover:text-ivory transition-colors duration-500">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-medium">
                      Explore
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
