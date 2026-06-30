export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="h-8 w-48 animate-pulse bg-ivory-dark" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[3/4] animate-pulse bg-ivory-dark" />
              <div className="h-4 w-3/4 animate-pulse bg-ivory-dark" />
              <div className="h-3 w-1/2 animate-pulse bg-ivory-dark" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
