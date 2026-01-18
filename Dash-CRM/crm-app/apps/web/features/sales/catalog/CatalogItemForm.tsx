"use client";

import { useState } from "react";
import type { CatalogItemDTO } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";

export function CatalogItemForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<CatalogItemDTO>;
  onSubmit: (payload: Partial<CatalogItemDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice?.toString() ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "BRL");
  const [active, setActive] = useState(initial?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        unitPrice: unitPrice ? Number(unitPrice) : 0,
        currency,
        active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o item do catálogo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nome</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Descrição</label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Preço unitário</label>
          <Input
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            type="number"
            min="0"
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Moeda</label>
          <Input value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[var(--color-accent)]"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        Ativo
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar item"}
        </Button>
      </div>
    </form>
  );
}
