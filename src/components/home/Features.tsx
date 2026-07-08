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
    <section className="py-16 border-b border-ivory-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-ivory-dark/50 border border-ivory-dark rounded-full mb-4 group-hover:border-gold/20 group-hover:bg-gold/5 transition-all duration-500">
                <feature.icon className="h-5 w-5 text-charcoal-muted group-hover:text-gold-dark transition-colors duration-500" />
              </div>
              <h3 className="text-[13px] font-semibold text-charcoal tracking-wide">
                {feature.title}
              </h3>
              <p className="text-[11px] text-charcoal-muted mt-1">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
