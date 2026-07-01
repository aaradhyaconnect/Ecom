import Link from "next/link";
import Image from "next/image";
import { Camera } from "lucide-react";

const GALLERY_ITEMS = [
  { src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop", alt: "Fashion look 1" },
  { src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=400&fit=crop", alt: "Fashion look 2" },
  { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop", alt: "Fashion look 3" },
  { src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=400&fit=crop", alt: "Fashion look 4" },
  { src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=400&fit=crop", alt: "Fashion look 5" },
  { src: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=400&fit=crop", alt: "Fashion look 6" },
];

export function InstagramGallery() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-[1px] w-8 bg-gold/50" />
            <Camera className="h-4 w-4 text-gold" />
            <span className="h-[1px] w-8 bg-gold/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-charcoal">
            @hainju
          </h2>
          <p className="text-sm text-charcoal-muted mt-2">
            Follow us for daily style inspiration
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {GALLERY_ITEMS.map((item, idx) => (
            <Link
              key={idx}
              href="https://instagram.com/hainju"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden group"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 33vw, 16vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                <Camera className="h-6 w-6 text-ivory opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
