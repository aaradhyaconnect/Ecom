export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-dark/30 px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
