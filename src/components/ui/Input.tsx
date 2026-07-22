"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-faint">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-2.5 border rounded-lg text-sm text-charcoal bg-white",
              "border-border-light",
              "placeholder:text-charcoal-faint",
              "focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]",
              "transition-all duration-200 ease-out",
              icon && "pl-10",
              error && "border-error/40 focus:border-error focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-charcoal-faint">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

/* ===== TEXTAREA ===== */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-4 py-2.5 border rounded-lg text-sm text-charcoal bg-white resize-y min-h-[100px]",
            "border-border-light",
            "placeholder:text-charcoal-faint",
            "focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]",
            "transition-all duration-200 ease-out",
            error && "border-error/40 focus:border-error focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-charcoal-faint">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
