"use client";

import { useState } from "react";
import type { CompanyDTO, ContactDTO, TicketDTO } from "@ateliux/shared";
import { ticketPriorityValues, ticketStatusValues } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { formatEnumLabel } from "../../../lib/labels";

export function TicketForm({
  initial,
  companies,
  contacts,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<TicketDTO>;
  companies: CompanyDTO[];
  contacts: ContactDTO[];
  onSubmit: (payload: Partial<TicketDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TicketDTO["status"]>(initial?.status ?? "OPEN");
  const [priority, setPriority] = useState<TicketDTO["priority"]>(initial?.priority ?? "MEDIUM");
  const [companyId, setCompanyId] = useState(initial?.companyId ?? "");
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        status,
        priority,
        companyId: companyId || undefined,
        contactId: contactId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o chamado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Título</label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Status</label>
        <Select value={status} onChange={(event) => setStatus(event.target.value as TicketDTO["status"])} className="mt-2">
          {ticketStatusValues.map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Prioridade</label>
        <Select value={priority} onChange={(event) => setPriority(event.target.value as TicketDTO["priority"])} className="mt-2">
          {ticketPriorityValues.map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </Select>
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
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Descrição</label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar chamado"}
        </Button>
      </div>
    </form>
  );
}
