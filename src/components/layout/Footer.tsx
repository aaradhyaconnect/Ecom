import Link from "next/link";
import { Heart, ArrowUp } from "lucide-react";
import { SITE, FOOTER_LINKS } from "@/lib/constants/site";

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/50 relative">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 lg:gap-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-serif font-bold tracking-[0.3em] text-ivory inline-block mb-5">
              {SITE.name}
            </Link>
            <p className="text-[13px] text-ivory/50 leading-relaxed max-w-xs">
              Premium self-designed clothing and exquisite artificial jewellery for the modern trendsetter.
            </p>
            <div className="flex items-center gap-3 mt-8">
              <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className="group p-2.5 rounded-full border border-ivory/8 hover:border-gold/30 hover:bg-gold/5 transition-all duration-300" aria-label="Instagram">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ivory/50 group-hover:text-gold-light transition-colors" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/></svg>
              </a>
              <a href={SITE.social.facebook} target="_blank" rel="noopener noreferrer" className="group p-2.5 rounded-full border border-ivory/8 hover:border-gold/30 hover:bg-gold/5 transition-all duration-300" aria-label="Facebook">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ivory/50 group-hover:text-gold-light transition-colors" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href={SITE.social.twitter} target="_blank" rel="noopener noreferrer" className="group p-2.5 rounded-full border border-ivory/8 hover:border-gold/30 hover:bg-gold/5 transition-all duration-300" aria-label="Twitter">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ivory/50 group-hover:text-gold-light transition-colors" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href={SITE.social.pinterest} target="_blank" rel="noopener noreferrer" className="group p-2.5 rounded-full border border-ivory/8 hover:border-gold/30 hover:bg-gold/5 transition-all duration-300" aria-label="Pinterest">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ivory/50 group-hover:text-gold-light transition-colors" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.8-.2-2.1 0-3 .2-.8 1.3-5.4 1.3-5.4s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-1 3.9-.3 1.2.6 2.1 1.7 2.1 2.1 0 3.7-2.2 3.7-5.4 0-2.8-2-4.8-5-4.8-3.4 0-5.4 2.5-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.3-.1.6-.1.4-.3 1.3-.4 1.5-.1.2-.2.3-.4.2-1.6-.7-2.6-3-2.6-4.8 0-3.9 2.8-7.5 8.2-7.5 4.3 0 7.7 3.1 7.7 7.2 0 4.3-2.7 7.7-6.5 7.7-1.3 0-2.5-.7-2.9-1.5l-.8 3c-.3 1.1-1.1 2.5-1.6 3.3 1.2.4 2.5.6 3.8.6 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory/50 mb-6">Shop</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-ivory/40 hover:text-ivory transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory/50 mb-6">Customer Service</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.customer.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-ivory/40 hover:text-ivory transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory/50 mb-6">Help</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-ivory/40 hover:text-ivory transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ivory/50 mb-6">Company</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-ivory/40 hover:text-ivory transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-ivory/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-ivory/40">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <p className="text-[11px] text-ivory/40 flex items-center gap-1.5">
              Made with <Heart className="h-3 w-3 text-gold/60" /> in India
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="p-2 rounded-full border border-ivory/8 hover:border-gold/30 hover:bg-gold/5 transition-all duration-300 group"
              aria-label="Back to top"
            >
              <ArrowUp className="h-3 w-3 text-ivory/45 group-hover:text-gold-light transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
