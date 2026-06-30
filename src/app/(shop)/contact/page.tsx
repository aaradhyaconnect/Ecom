import { SITE } from "@/lib/constants/site";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata = { title: "Contact Us — HAINJU" };

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-medium">Get in Touch</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Contact Us</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      <div className="grid md:grid-cols-3 gap-12 mb-16">
        <div className="text-center">
          <div className="w-12 h-12 bg-ivory-dark flex items-center justify-center mx-auto mb-4">
            <Mail className="h-5 w-5 text-gold" />
          </div>
          <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">Email</h3>
          <a href={`mailto:${SITE.email}`} className="text-sm text-charcoal-muted hover:text-gold-dark transition-colors">
            {SITE.email}
          </a>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-ivory-dark flex items-center justify-center mx-auto mb-4">
            <Phone className="h-5 w-5 text-gold" />
          </div>
          <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">Phone</h3>
          <a href={`tel:${SITE.phone}`} className="text-sm text-charcoal-muted hover:text-gold-dark transition-colors">
            {SITE.phone}
          </a>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-ivory-dark flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-5 w-5 text-gold" />
          </div>
          <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">Address</h3>
          <p className="text-sm text-charcoal-muted">{SITE.address}</p>
        </div>
      </div>

      <div className="bg-ivory-dark/50 p-8 md:p-12">
        <h2 className="text-2xl font-serif font-bold text-charcoal mb-6">Send us a Message</h2>
        <form className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input type="text" placeholder="Your Name" className="w-full border border-ivory-dark bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-muted focus:border-gold/60 focus:ring-0 outline-none" />
            <input type="email" placeholder="Your Email" className="w-full border border-ivory-dark bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-muted focus:border-gold/60 focus:ring-0 outline-none" />
          </div>
          <input type="text" placeholder="Subject" className="w-full border border-ivory-dark bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-muted focus:border-gold/60 focus:ring-0 outline-none" />
          <textarea rows={5} placeholder="Your Message" className="w-full border border-ivory-dark bg-ivory px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-muted focus:border-gold/60 focus:ring-0 outline-none resize-none" />
          <button type="submit" className="bg-charcoal text-ivory px-8 py-3 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-charcoal-light transition-colors duration-300">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
