import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "sale" | "new" | "best" | "success" | "warning" | "error" | "info" | "gold";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = "default", size = "sm", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold uppercase tracking-wider rounded-full",
        {
          /* Sizes */
          "px-2 py-0.5 text-[9px]": size === "sm",
          "px-2.5 py-1 text-[10px]": size === "md",
        },
        {
          /* Default — charcoal */
          "bg-charcoal/80 text-ivory": variant === "default",

          /* Sale — rose */
          "bg-error text-white": variant === "sale",

          /* New — charcoal */
          "bg-charcoal text-ivory": variant === "new",

          /* Best — gold */
          "bg-gold text-charcoal": variant === "best",

          /* Success — green */
          "bg-success-light text-success-dark": variant === "success",

          /* Warning — amber */
          "bg-warning-light text-warning-dark": variant === "warning",

          /* Error — red */
          "bg-error-light text-error-dark": variant === "error",

          /* Info — blue */
          "bg-info-light text-info-dark": variant === "info",

          /* Gold — luxury accent */
          "bg-gold/15 text-gold-dark border border-gold/20": variant === "gold",
        },
        className
      )}
    >
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          {
            "bg-current opacity-60": variant === "default" || variant === "new",
            "bg-white/80": variant === "sale" || variant === "best",
            "bg-success": variant === "success",
            "bg-warning": variant === "warning",
            "bg-error": variant === "error",
            "bg-info": variant === "info",
            "bg-gold": variant === "gold",
          }
        )} />
      )}
      {children}
    </span>
  );
}
