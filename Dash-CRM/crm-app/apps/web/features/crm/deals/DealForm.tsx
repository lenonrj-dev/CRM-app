"use client";

import { useState } from "react";
import type { CompanyDTO, ContactDTO, DealDTO } from "@ateliux/shared";
import { dealStageValues } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { formatEnumLabel } from "../../../lib/labels";

export function DealForm({
  initial,
  companies,
  contacts,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<DealDTO>;
  companies: CompanyDTO[];
  contacts: ContactDTO[];
  onSubmit: (payload: Partial<DealDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [stage, setStage] = useState<DealDTO["stage"]>(initial?.stage ?? "NEW");
  const [value, setValue] = useState(String(initial?.value ?? ""));
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    initial?.expectedCloseDate ? initial.expectedCloseDate.slice(0, 10) : "",
  );
  const [companyId, setCompanyId] = useState(initial?.companyId ?? "");
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [lostReason, setLostReason] = useState(initial?.lostReason ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        stage,
        value: value ? Number(value) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : undefined,
        companyId: companyId || undefined,
        contactId: contactId || undefined,
        lostReason: stage === "LOST" ? lostReason || undefined : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a oportunidade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nome da oportunidade</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Etapa</label>
        <Select value={stage} onChange={(event) => setStage(event.target.value as DealDTO["stage"])} className="mt-2">
          {dealStageValues.map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Valor (R$)</label>
        <Input value={value} onChange={(event) => setValue(event.target.value)} type="number" className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Fechamento previsto</label>
        <Input
          value={expectedCloseDate}
          onChange={(event) => setExpectedCloseDate(event.target.value)}
          type="date"
          className="mt-2"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Empresa</label>
        <Select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="mt-2">
          <option value="">Sem empresa</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Contato</label>
        <Select value={contactId} onChange={(event) => setContactId(event.target.value)} className="mt-2">
          <option value="">Sem contato</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.firstName} {contact.lastName}
            </option>
          ))}
        </Select>
      </div>
      {stage === "LOST" ? (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Motivo da perda</label>
          <Input value={lostReason} onChange={(event) => setLostReason(event.target.value)} className="mt-2" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar oportunidade"}
        </Button>
      </div>
    </form>
  );
}
