"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full px-4 py-2.5 border rounded-lg text-sm bg-white text-charcoal appearance-none",
            "border-border-light",
            "focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]",
            "transition-all duration-200 ease-out",
            "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B6B6B%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.2rem] bg-[right_0.75rem_center] bg-no-repeat",
            error && "border-error/40 focus:border-error focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-charcoal-faint">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
