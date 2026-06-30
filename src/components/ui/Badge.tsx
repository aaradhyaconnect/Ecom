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
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
        {
          "bg-charcoal/5 text-charcoal": variant === "default",
          "bg-rose-400/10 text-rose-500": variant === "sale",
          "bg-charcoal text-ivory": variant === "new",
          "bg-gold/10 text-gold-dark": variant === "best",
          "bg-green-100 text-green-800": variant === "success",
          "bg-yellow-100 text-yellow-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "error",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
