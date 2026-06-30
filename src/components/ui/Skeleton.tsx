import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-ivory-dark",
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-3 w-64 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-20" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-px w-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-12 h-10" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="w-10 h-10 rounded-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
