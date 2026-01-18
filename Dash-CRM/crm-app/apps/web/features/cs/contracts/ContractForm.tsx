"use client";

import { useState } from "react";
import type { CompanyDTO, ContractDTO } from "@ateliux/shared";
import { contractStatusValues, renewalStatusValues } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { formatEnumLabel } from "../../../lib/labels";

export function ContractForm({
  initial,
  companies,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ContractDTO>;
  companies: CompanyDTO[];
  onSubmit: (payload: Partial<ContractDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [companyId, setCompanyId] = useState(initial?.companyId ?? companies[0]?.id ?? "");
  const [startAt, setStartAt] = useState(initial?.startAt?.slice(0, 10) ?? "");
  const [endAt, setEndAt] = useState(initial?.endAt?.slice(0, 10) ?? "");
  const [value, setValue] = useState(initial?.value?.toString() ?? "");
  const [status, setStatus] = useState(initial?.status ?? contractStatusValues[0]);
  const [renewalStatus, setRenewalStatus] = useState(initial?.renewalStatus ?? renewalStatusValues[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toIso = (value: string) => (value ? new Date(value).toISOString() : undefined);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        companyId,
        startAt: toIso(startAt),
        endAt: toIso(endAt),
        value: value ? Number(value) : 0,
        status,
        renewalStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o contrato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Empresa</label>
        <Select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="mt-2">
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Início</label>
          <Input value={startAt} onChange={(event) => setStartAt(event.target.value)} type="date" className="mt-2" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Término</label>
          <Input value={endAt} onChange={(event) => setEndAt(event.target.value)} type="date" className="mt-2" />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Valor</label>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            type="number"
            min="0"
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Status</label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2">
            {contractStatusValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Status de renovação</label>
        <Select value={renewalStatus} onChange={(event) => setRenewalStatus(event.target.value)} className="mt-2">
          {renewalStatusValues.map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </Select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar contrato"}
        </Button>
      </div>
    </form>
  );
}
