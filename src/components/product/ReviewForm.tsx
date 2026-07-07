"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, comment }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Review submitted!");
        setRating(0);
        setComment("");
        onReviewSubmitted();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-ivory border border-ivory-dark/60 p-6 shadow-sm">
      <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-charcoal-muted mb-4">Write a Review</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-charcoal mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-gold text-gold"
                    : "text-charcoal/20"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-charcoal mb-2">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience with this product..."
          className="w-full border border-ivory-dark/60 px-4 py-2.5 text-sm focus:border-gold/60 focus:ring-0 outline-none bg-ivory text-charcoal placeholder:text-charcoal-muted/40"
        />
      </div>

      <Button onClick={handleSubmit} isLoading={submitting} size="sm">
        Submit Review
      </Button>
    </div>
  );
}
