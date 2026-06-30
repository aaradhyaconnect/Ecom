import { Truck, Shield, RotateCcw, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
  },
  {
    icon: Shield,
    title: "Secure Checkout",
    description: "100% secure payments",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day return policy",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "WhatsApp & email support",
  },
];

export function Features() {
  return (
    <section className="py-20 border-y border-ivory-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="text-center group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ivory to-ivory-dark shadow-sm border border-ivory-dark mb-5 group-hover:shadow-md group-hover:border-gold/20 group-hover:from-ivory group-hover:to-gold/5 transition-all duration-500">
                <feature.icon className="h-6 w-6 text-charcoal-muted group-hover:text-gold-dark transition-colors duration-500" />
              </div>
              <h3 className="text-sm font-semibold text-charcoal tracking-wide">
                {feature.title}
              </h3>
              <p className="text-[11px] text-charcoal-muted mt-1.5 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
