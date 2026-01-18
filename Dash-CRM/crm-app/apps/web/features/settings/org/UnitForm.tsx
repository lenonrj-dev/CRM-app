"use client";

import { useState } from "react";
import type { UnitDTO } from "@ateliux/shared";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export function UnitForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<UnitDTO>;
  onSubmit: (payload: Partial<UnitDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ name, region: region || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a unidade");
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
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Região</label>
        <Input value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar unidade"}
        </Button>
      </div>
    </form>
  );
}
