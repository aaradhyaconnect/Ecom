import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outlined" | "raised" | "flat";
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "article" | "section";
}

export function Card({
  children,
  className,
  variant = "default",
  hover = false,
  padding = "md",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl transition-all duration-300 ease-out",
        {
          /* Default — subtle shadow */
          "bg-white border border-border-light shadow-xs": variant === "default",

          /* Outlined — no shadow, stronger border */
          "bg-white border border-border": variant === "outlined",

          /* Raised — elevated */
          "bg-white border border-border-light shadow-md": variant === "raised",

          /* Flat — no border, no shadow */
          "bg-surface-raised": variant === "flat",
        },
        {
          "p-0": padding === "none",
          "p-3": padding === "sm",
          "p-5": padding === "md",
          "p-7": padding === "lg",
        },
        hover && "card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/* Card sub-components */
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3" | "h4";
}

export function CardTitle({ children, className, as: Tag = "h3" }: CardTitleProps) {
  return (
    <Tag className={cn("heading-4 text-charcoal", className)}>
      {children}
    </Tag>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-charcoal-muted", className)}>
      {children}
    </p>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("flex items-center gap-2 pt-4 border-t border-border-light mt-4", className)}>
      {children}
    </div>
  );
}
