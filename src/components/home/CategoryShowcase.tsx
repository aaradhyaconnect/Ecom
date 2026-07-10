import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";

export function CategoryShowcase() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-[1px] w-8 bg-gold/40" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
              Explore
            </span>
            <span className="h-[1px] w-8 bg-gold/40" />
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
              className="group relative aspect-[3/4] overflow-hidden bg-beige rounded-xl"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-[1000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent group-hover:from-black/70 transition-all duration-500" />

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-20">
                <h3 className="text-ivory text-sm md:text-base font-semibold tracking-wide">
                  {category.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  <span className="text-gold-light text-[10px] uppercase tracking-[0.2em] font-medium">
                    Shop Now
                  </span>
                  <ArrowRight className="h-3 w-3 text-gold-light group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm flex items-center justify-center rounded-full border border-white/20">
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
