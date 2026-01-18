"use client";

import { useMemo, useState } from "react";
import type { TerritoryDTO, TeamDTO, UnitDTO, UserDTO } from "@ateliux/shared";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { formatEnumLabel } from "../../../lib/labels";

const splitValues = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function TerritoryForm({
  initial,
  units,
  teams,
  users,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<TerritoryDTO>;
  units: UnitDTO[];
  teams: TeamDTO[];
  users: UserDTO[];
  onSubmit: (payload: Partial<TerritoryDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [unitId, setUnitId] = useState(initial?.unitId ?? "");
  const [teamId, setTeamId] = useState(initial?.teamId ?? "");
  const [ownerId, setOwnerId] = useState(initial?.ownerId ?? "");
  const [regions, setRegions] = useState(initial?.rules?.regions?.join(", ") ?? "");
  const [industries, setIndustries] = useState(initial?.rules?.industries?.join(", ") ?? "");
  const [sizes, setSizes] = useState(initial?.rules?.sizes?.join(", ") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamOptions = useMemo(
    () => teams.filter((team) => (!unitId ? true : team.unitId === unitId)),
    [teams, unitId],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        unitId: unitId || undefined,
        teamId: teamId || undefined,
        ownerId: ownerId || undefined,
        rules: {
          regions: splitValues(regions),
          industries: splitValues(industries),
          sizes: splitValues(sizes),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o território");
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
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Time</label>
        <Select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="mt-2">
          <option value="">Sem time</option>
          {teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Responsável</label>
        <Select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} className="mt-2">
          <option value="">Sem responsável</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({formatEnumLabel(user.role)})
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Regiões</label>
        <Input value={regions} onChange={(event) => setRegions(event.target.value)} className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Segmentos</label>
        <Input value={industries} onChange={(event) => setIndustries(event.target.value)} className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Porte da empresa</label>
        <Input value={sizes} onChange={(event) => setSizes(event.target.value)} className="mt-2" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar território"}
        </Button>
      </div>
    </form>
  );
}
