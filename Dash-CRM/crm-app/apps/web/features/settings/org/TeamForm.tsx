"use client";

import { useState } from "react";
import type { TeamDTO, UnitDTO } from "@ateliux/shared";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";

export function TeamForm({
  initial,
  units,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<TeamDTO>;
  units: UnitDTO[];
  onSubmit: (payload: Partial<TeamDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [unitId, setUnitId] = useState(initial?.unitId ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ name, unitId: unitId || undefined, color: color || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o time");
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
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Unidade</label>
        <Select value={unitId} onChange={(event) => setUnitId(event.target.value)} className="mt-2">
          <option value="">Sem unidade</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Cor</label>
        <Input value={color} onChange={(event) => setColor(event.target.value)} className="mt-2" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar time"}
        </Button>
      </div>
    </form>
  );
}
