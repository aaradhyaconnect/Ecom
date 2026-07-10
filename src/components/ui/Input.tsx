"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-charcoal dark:text-white mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-muted dark:text-white/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-2.5 border border-ivory-dark rounded-sm text-sm text-charcoal dark:text-white",
              "focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)]",
              "placeholder:text-charcoal-muted dark:placeholder:text-white/30 transition-all duration-300 bg-ivory dark:bg-white/5",
              icon && "pl-10",
              error && "border-rose-400 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.1)]",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
