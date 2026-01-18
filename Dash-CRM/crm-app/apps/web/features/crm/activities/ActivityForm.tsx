"use client";

import { useState } from "react";
import type { ActivityDTO, CompanyDTO, ContactDTO, DealDTO } from "@ateliux/shared";
import { activityTypeValues } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { formatEnumLabel } from "../../../lib/labels";

export function ActivityForm({
  initial,
  companies,
  contacts,
  deals,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ActivityDTO>;
  companies: CompanyDTO[];
  contacts: ContactDTO[];
  deals: DealDTO[];
  onSubmit: (payload: Partial<ActivityDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<ActivityDTO["type"]>(initial?.type ?? "TASK");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [companyId, setCompanyId] = useState(initial?.companyId ?? "");
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [dealId, setDealId] = useState(initial?.dealId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        type,
        subject,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes || undefined,
        companyId: companyId || undefined,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a atividade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Tipo</label>
        <Select value={type} onChange={(event) => setType(event.target.value as ActivityDTO["type"])} className="mt-2">
          {activityTypeValues.map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Assunto</label>
        <Input value={subject} onChange={(event) => setSubject(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Data limite</label>
        <Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" className="mt-2" />
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
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Oportunidade</label>
        <Select value={dealId} onChange={(event) => setDealId(event.target.value)} className="mt-2">
          <option value="">Sem oportunidade</option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Notas</label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar atividade"}
        </Button>
      </div>
    </form>
  );
}
