import clsx from "clsx";
import { formatEnumLabel } from "../../lib/labels";

export function FiltersBar({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={clsx(
            "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
            value === option
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
              : "border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:text-[var(--color-ink)]",
          )}
        >
          {formatEnumLabel(option)}
        </button>
      ))}
    </div>
  );
}
