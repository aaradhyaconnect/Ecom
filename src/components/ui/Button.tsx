"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  glow?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
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
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isIconOnly = icon && !children;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-300 ease-out rounded-lg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          "active:scale-[0.98]",
          {
            /* Primary — solid dark */
            "bg-charcoal text-ivory hover:bg-charcoal-light active:bg-primary-active shadow-sm hover:shadow-md hover:shadow-charcoal/10":
              variant === "primary",

            /* Secondary — gold tint */
            "bg-gold/10 text-gold-dark hover:bg-gold/15 border border-gold/20 hover:border-gold/40 hover:shadow-sm hover:shadow-gold/5":
              variant === "secondary",

            /* Outline — bordered */
            "border border-border text-charcoal hover:bg-surface-raised hover:border-border-dark hover:shadow-sm":
              variant === "outline",

            /* Ghost — minimal */
            "text-charcoal-muted hover:bg-surface-raised hover:text-charcoal":
              variant === "ghost",

            /* Danger — destructive */
            "bg-error/10 text-error hover:bg-error/15 border border-error/10 hover:border-error/30 hover:shadow-sm hover:shadow-error/5":
              variant === "danger",

            /* Link — inline text */
            "text-charcoal underline-offset-4 hover:underline p-0 h-auto":
              variant === "link",
          },
          {
            /* XS */
            "px-3 py-1 text-[10px] tracking-wider gap-1": size === "xs" && !isIconOnly,
            /* SM */
            "px-4 py-2 text-[11px] tracking-wide gap-1.5": size === "sm" && !isIconOnly,
            /* MD */
            "px-6 py-2.5 text-xs tracking-wide gap-2": size === "md" && !isIconOnly,
            /* LG */
            "px-8 py-3.5 text-sm tracking-wide gap-2.5": size === "lg" && !isIconOnly,
            /* Icon-only sizes */
            "p-1.5": isIconOnly && size === "xs",
            "p-2": isIconOnly && size === "sm",
            "p-2.5": isIconOnly && size === "md",
            "p-3": isIconOnly && size === "lg",
          },
          fullWidth && "w-full",
          glow && variant === "primary" && "glow-on-hover",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn("animate-spin", {
            "h-3 w-3": size === "xs",
            "h-3.5 w-3.5": size === "sm",
            "h-4 w-4": size === "md",
            "h-5 w-5": size === "lg",
          })} />
        ) : (
          icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
