import clsx from "clsx";
import type { HTMLAttributes } from "react";

const variants = {
  neutral: "bg-[#f1eee7] text-[#5c5f66]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]",
  success: "bg-[#e8f6ed] text-[#2d7a4b]",
  warning: "bg-[#fff4df] text-[#b06a00]",
  danger: "bg-[#ffe8e3] text-[#c64735]",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
