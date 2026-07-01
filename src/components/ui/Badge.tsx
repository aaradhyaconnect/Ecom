import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "sale" | "new" | "best" | "success" | "warning" | "error";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-[0.15em]",
        {
          "bg-charcoal/5 text-charcoal backdrop-blur-sm": variant === "default",
          "bg-rose-500/90 text-white backdrop-blur-sm": variant === "sale",
          "bg-charcoal/90 text-ivory backdrop-blur-sm": variant === "new",
          "bg-gold/90 text-charcoal backdrop-blur-sm": variant === "best",
          "bg-green-100 text-green-800": variant === "success",
          "bg-yellow-100 text-yellow-800": variant === "warning",
          "bg-rose-100 text-rose-800": variant === "error",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
