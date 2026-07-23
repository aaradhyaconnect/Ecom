import type { Metadata } from "next";
import { SITE } from "@/lib/constants/site";
import { Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Femme Drip team. Explore open positions in fashion design, marketing, and more.",
  alternates: { canonical: "/careers" },
};

const OPENINGS = [
  {
    title: "Fashion Designer",
    type: "Full-time",
    location: "Mumbai",
    description: "Design unique clothing and jewellery pieces for our seasonal collections.",
  },
  {
    title: "Social Media Manager",
    type: "Full-time",
    location: "Remote",
    description: "Manage our brand presence across Instagram, Pinterest, and other platforms.",
  },
  {
    title: "Customer Experience Lead",
    type: "Full-time",
    location: "Mumbai",
    description: "Lead our customer support team to deliver exceptional shopping experiences.",
  },
  {
    title: "Photographer / Content Creator",
    type: "Contract",
    location: "Mumbai",
    description: "Create stunning product photography and lifestyle content for our collections.",
  },
];

export default function CareersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold-dark font-medium">Join Our Team</span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mt-4">Careers at {SITE.name}</h1>
        <div className="h-[1px] w-12 bg-gold/40 mx-auto mt-6" />
      </div>

      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-lg leading-relaxed text-charcoal-muted">
          Be part of a passionate team that&apos;s redefining fashion. We&apos;re always looking for creative,
          driven individuals to help us grow.
        </p>
      </div>

      <div className="space-y-6 mb-16">
        {OPENINGS.map((job) => (
          <div key={job.title} className="border border-ivory-dark bg-ivory/50 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-charcoal">{job.title}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-charcoal-muted uppercase tracking-[0.1em]">
                  <span>{job.type}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                </div>
              </div>
              <a
                href={`mailto:${SITE.email}?subject=Application for ${job.title}`}
                className="inline-block bg-charcoal text-ivory px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-charcoal-light transition-colors duration-300 text-center whitespace-nowrap"
              >
                Apply Now
              </a>
            </div>
            <p className="text-sm text-charcoal-muted mt-4 leading-relaxed">{job.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-ivory-dark/50 p-8 md:p-12 text-center">
        <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Don&apos;t See a Fit?</h2>
        <p className="text-sm text-charcoal-muted leading-relaxed max-w-2xl mx-auto mb-6">
          We&apos;re always excited to hear from talented individuals. Send us your resume and portfolio,
          and we&apos;ll keep you in mind for future opportunities.
        </p>
        <a
          href={`mailto:${SITE.email}?subject=General Application`}
          className="inline-flex items-center gap-2 text-gold-dark text-sm font-medium hover:text-gold transition-colors"
        >
          <Mail className="h-4 w-4" />
          Send us your resume
        </a>
      </div>
    </div>
  );
}
