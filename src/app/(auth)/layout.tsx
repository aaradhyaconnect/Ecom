import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4 py-8 sm:py-12 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-serif font-bold text-charcoal tracking-[0.35em]">ARCON STYLE</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark mt-2">Premium Collections</p>
            <div className="w-8 h-[1px] bg-gold/60 mx-auto mt-3" />
          </Link>
        </div>
        {children}
        <div className="text-center mt-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted">&copy; {new Date().getFullYear()} Arcon Style</p>
        </div>
      </div>
    </div>
  );
}
