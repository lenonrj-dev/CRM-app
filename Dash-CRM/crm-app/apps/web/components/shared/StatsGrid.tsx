import type { ReactNode } from "react";
import { Card } from "../ui/Card";

export type StatItem = {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
};

export function StatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{item.label}</p>
            {item.icon}
          </div>
          <p className="mt-4 text-2xl font-semibold">{item.value}</p>
          {item.trend ? <p className="mt-1 text-xs text-[var(--color-muted)]">{item.trend}</p> : null}
        </Card>
      ))}
    </div>
  );
}
