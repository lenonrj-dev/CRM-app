"use client";

import { useState } from "react";
import type { TeamDTO, UnitDTO, UserDTO, UserMembershipDTO } from "@ateliux/shared";
import { membershipStatusValues, roleValues, visibilityScopeValues } from "@ateliux/shared";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { formatEnumLabel } from "../../../lib/labels";

export function MemberForm({
  initial,
  users,
  units,
  teams,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<UserMembershipDTO> & { userId?: string };
  users: UserDTO[];
  units: UnitDTO[];
  teams: TeamDTO[];
  onSubmit: (payload: Partial<UserMembershipDTO> & { userId: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState(initial?.userId ?? "");
  const [unitId, setUnitId] = useState(initial?.unitId ?? "");
  const [teamId, setTeamId] = useState(initial?.teamIds?.[0] ?? "");
  const [role, setRole] = useState(initial?.role ?? roleValues[0]);
  const [scope, setScope] = useState(initial?.scope ?? visibilityScopeValues[0]);
  const [status, setStatus] = useState(initial?.status ?? membershipStatusValues[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        userId,
        unitId: unitId || undefined,
        teamIds: teamId ? [teamId] : [],
        role,
        scope,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o membro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Usuário</label>
        <Select value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-2">
          <option value="">Selecione o usuário</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </Select>
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
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Perfil</label>
          <Select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2">
            {roleValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Escopo</label>
          <Select value={scope} onChange={(event) => setScope(event.target.value)} className="mt-2">
            {visibilityScopeValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Status</label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2">
            {membershipStatusValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !userId}>
          {loading ? "Salvando..." : "Salvar membro"}
        </Button>
      </div>
    </form>
  );
}
