import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-dark/20 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#d4c9b8_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-serif font-bold text-charcoal tracking-[0.15em]">HAINJU</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold-dark mt-1">Premium Collections</p>
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -top-3 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          {children}
        </div>
        <div className="text-center mt-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal-muted/40">&copy; {new Date().getFullYear()} HAINJU</p>
        </div>
      </div>
    </div>
  );
}
