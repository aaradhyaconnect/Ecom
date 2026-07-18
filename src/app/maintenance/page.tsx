export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="h-16 w-16 bg-charcoal mx-auto mb-6 flex items-center justify-center">
          <span className="text-ivory text-2xl font-serif font-bold">A</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-charcoal mb-3">Under Maintenance</h1>
        <p className="text-charcoal-muted text-sm leading-relaxed">
          We are currently performing scheduled maintenance. Our store will be back online shortly. Thank you for your patience.
        </p>
        <div className="mt-8 text-xs text-charcoal-muted/60">
          G2I Style &mdash; Curated Luxury Fashion
        </div>
      </div>
    </div>
  );
}
