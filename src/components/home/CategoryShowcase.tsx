import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";

export function CategoryShowcase() {
  return (
    <section className="py-24 md:py-32 bg-ivory-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-[1px] w-8 bg-gold/50" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
              Collections
            </span>
            <span className="h-[1px] w-8 bg-gold/50" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-charcoal">
            Shop by Category
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {CATEGORIES.map((category, i) => (
            <Link
              key={category.id}
              href={`/products/${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-charcoal"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-[800ms] ease-out opacity-70 group-hover:opacity-90"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-charcoal/20 z-10" />

              <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                <h3 className="text-ivory text-sm md:text-base font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">
                  {category.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <span className="text-gold-light text-[10px] uppercase tracking-[0.2em] font-medium">
                    Explore
                  </span>
                  <ArrowRight className="h-3 w-3 text-gold-light" />
                </div>
              </div>

              <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8  bg-ivory/10 backdrop-blur-sm flex items-center justify-center border border-ivory/10">
                  <ArrowRight className="h-3 w-3 text-ivory -rotate-45" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
