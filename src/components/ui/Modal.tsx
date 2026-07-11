"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showClose = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  const handleTabTrap = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !contentRef.current) return;

      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTabTrap);
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        if (!contentRef.current) return;
        const firstInput = contentRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]), textarea, select'
        );
        if (firstInput) {
          firstInput.focus();
        }
      });
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabTrap);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleEscape, handleTabTrap]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 bg-ivory shadow-2xl max-h-[90vh] overflow-auto animate-in fade-in zoom-in-95 duration-200",
          {
            "w-full max-w-sm": size === "sm",
            "w-full max-w-md": size === "md",
            "w-full max-w-lg": size === "lg",
            "w-full max-w-2xl": size === "xl",
            "w-full max-w-full mx-4": size === "full",
          }
        )}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 border-b border-ivory-dark">
            {title && (
              <h2 id="modal-title" className="text-lg font-serif font-semibold text-charcoal">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 hover:bg-ivory-dark transition-colors rounded"
              >
                <X className="h-5 w-5 text-charcoal-muted" />
              </button>
            )}
          </div>
        )}
        <div className="p-4 text-charcoal">{children}</div>
      </div>
    </div>
  );
}
