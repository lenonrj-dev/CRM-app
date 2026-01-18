import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-shell)] disabled:opacity-60 disabled:pointer-events-none";

const variants = {
  primary:
    "bg-[var(--color-accent)] text-white shadow-[0_12px_30px_rgba(36,199,218,0.25)] hover:bg-[var(--color-accent-strong)]",
  secondary: "bg-white text-[var(--color-ink)] border border-[var(--color-border)] hover:border-[#d8d3c8]",
  ghost: "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  pill?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  pill = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], pill ? "rounded-full" : "rounded-xl", className)}
      {...props}
    />
  );
}
