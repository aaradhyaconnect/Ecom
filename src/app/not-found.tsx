import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-8xl font-bold tracking-tighter text-gray-900">
        404
      </h1>
      <p className="mt-4 text-lg text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <p className="mt-1 text-sm text-gray-400">
        Try searching our store or head back home.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Go Home
        </Link>
        <Link
          href="/search"
          className="rounded-full border border-gray-200 px-8 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-900"
        >
          Search Store
        </Link>
      </div>
    </div>
  );
}
