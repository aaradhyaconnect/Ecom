import { Star } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/server";
import type { Review } from "@/types";

async function getReviews(): Promise<Review[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .gte("rating", 4)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) return [];
    return (data as Review[]) || [];
  } catch {
    return [];
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? "fill-gold text-gold" : "text-charcoal-muted/30"
          }`}
        />
      ))}
    </div>
  );
}

export async function CustomerReviews() {
  const reviews = await getReviews();

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-ivory-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center gap-3 justify-center mb-3">
            <span className="h-[1px] w-8 bg-gold/50" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">
              Testimonials
            </span>
            <span className="h-[1px] w-8 bg-gold/50" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-charcoal">
            What Our Customers Say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((review) => (
            <div
              key={review.id}
              className="bg-ivory border border-ivory-dark p-6 md:p-8"
            >
              <StarRating rating={review.rating} />
              <p className="text-sm text-charcoal mt-4 leading-relaxed line-clamp-4">
                &ldquo;{review.comment}&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-ivory-dark">
                <p className="text-sm font-medium text-charcoal">
                  {review.user_name || "Customer"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
