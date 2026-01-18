"use client";

import { useState } from "react";
import { lifecycleStageValues, onboardingItemStatusValues, type CustomerSuccessProfileDTO } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { formatEnumLabel } from "../../../lib/labels";

type ChecklistItem = {
  id?: string;
  title: string;
  status: string;
  dueDate?: string;
};

export function CSProfileForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<CustomerSuccessProfileDTO>;
  onSubmit: (payload: Partial<CustomerSuccessProfileDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [lifecycleStage, setLifecycleStage] = useState(
    initial?.lifecycleStage ?? lifecycleStageValues[0],
  );
  const [items, setItems] = useState<ChecklistItem[]>(
    initial?.onboardingChecklist?.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      dueDate: item.dueDate?.slice(0, 10),
    })) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (index: number, next: Partial<ChecklistItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...next } : item)));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        lifecycleStage,
        onboardingChecklist: items
          .filter((item) => item.title.trim())
          .map((item) => ({
            ...(item.id ? { id: item.id } : {}),
            title: item.title,
            status: item.status as any,
            dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : undefined,
          })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o perfil de CS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Etapa do ciclo</label>
        <Select value={lifecycleStage} onChange={(event) => setLifecycleStage(event.target.value)} className="mt-2">
          {lifecycleStageValues.map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Checklist de implantação</label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setItems((prev) => [...prev, { title: "", status: "PENDING" }])}
          >
            Adicionar item
          </Button>
        </div>
        <div className="mt-3 space-y-3">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <Input
                value={item.title}
                onChange={(event) => updateItem(index, { title: event.target.value })}
                placeholder="Item do checklist"
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Select value={item.status} onChange={(event) => updateItem(index, { status: event.target.value })}>
                  {onboardingItemStatusValues.map((value) => (
                    <option key={value} value={value}>
                      {formatEnumLabel(value)}
                    </option>
                  ))}
                </Select>
                <Input
                  type="date"
                  value={item.dueDate ?? ""}
                  onChange={(event) => updateItem(index, { dueDate: event.target.value })}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
          {!items.length ? <p className="text-sm text-[var(--color-muted)]">Nenhum item de checklist ainda.</p> : null}
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}
