import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function Rating({ rating, reviewCount, size = "sm", showCount }: RatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "text-amber-400",
            size === "sm" && "h-3 w-3",
            size === "md" && "h-4 w-4",
            size === "lg" && "h-5 w-5"
          )}
          fill={star <= Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
      {showCount && reviewCount !== undefined && (
        <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
      )}
    </div>
  );
}
