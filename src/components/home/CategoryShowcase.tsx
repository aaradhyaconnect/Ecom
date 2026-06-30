import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/constants/categories";

export function CategoryShowcase() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.3em] text-gold-dark font-medium">Collections</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-charcoal mt-3">Shop by Category</h2>
          <div className="w-16 h-[1px] bg-gold/40 mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {CATEGORIES.map((category, i) => (
            <Link
              key={category.id}
              href={`/products/${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden bg-ivory-dark"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                <h3 className="text-ivory text-sm md:text-base font-medium tracking-wide group-hover:tracking-wider transition-all duration-300">
                  {category.name}
                </h3>
                <span className="text-ivory/50 text-xs uppercase tracking-[0.2em] mt-1 block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore &rarr;
                </span>
              </div>
              {category.image && (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
              )}
              <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/10 transition-colors duration-500" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
