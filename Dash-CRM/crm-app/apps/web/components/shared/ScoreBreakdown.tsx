import type { ScoreBreakdownItem } from "@ateliux/shared";
import { Badge } from "../ui/Badge";

export function ScoreBreakdown({ items }: { items: ScoreBreakdownItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--color-muted)]">Nenhum fator de pontuação ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.label}-${item.score}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{item.label}</p>
            <Badge variant={item.score >= 0 ? "accent" : "neutral"}>{item.score}</Badge>
          </div>
          {item.notes ? <p className="mt-2 text-xs text-[var(--color-muted)]">{item.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}
