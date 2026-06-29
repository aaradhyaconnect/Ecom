import Link from "next/link";
import { CATEGORIES } from "@/lib/constants/categories";

export function CategoryShowcase() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold">Shop by Category</h2>
          <p className="text-gray-500 mt-3">Explore our curated collections</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/products/${category.slug}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <h3 className="text-white text-sm md:text-base font-semibold">
                  {category.name}
                </h3>
              </div>
              {category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
