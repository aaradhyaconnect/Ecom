"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      fullWidth,
      glow = true,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-400 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40 disabled:cursor-not-allowed",
          {
            "bg-charcoal text-ivory hover:bg-charcoal-light active:bg-charcoal hover:shadow-lg hover:shadow-charcoal/10":
              variant === "primary",
            "bg-gold/10 text-gold-dark hover:bg-gold/20 border border-gold/20 hover:border-gold/40 hover:shadow-md hover:shadow-gold/5":
              variant === "secondary",
            "border border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-ivory hover:border-charcoal hover:shadow-lg":
              variant === "outline",
            "text-charcoal-muted hover:bg-ivory-dark hover:text-charcoal":
              variant === "ghost",
            "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/10 hover:border-rose-500/30 hover:shadow-md hover:shadow-rose-500/5":
              variant === "danger",
          },
          {
            "px-3.5 py-1.5 text-[11px] tracking-wide": size === "sm",
            "px-6 py-2.5 text-xs tracking-wide": size === "md",
            "px-8 py-3.5 text-sm tracking-wide": size === "lg",
          },
          fullWidth && "w-full",
          glow && variant === "primary" && "glow-on-hover",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
