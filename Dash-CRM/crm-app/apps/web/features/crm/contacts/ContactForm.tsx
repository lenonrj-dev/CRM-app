"use client";

import { useState } from "react";
import type { CompanyDTO, ContactDTO } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";

export function ContactForm({
  initial,
  companies,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ContactDTO>;
  companies: CompanyDTO[];
  onSubmit: (payload: Partial<ContactDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [companyId, setCompanyId] = useState(initial?.companyId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        title: title || undefined,
        companyId: companyId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o contato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nome</label>
        <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Sobrenome</label>
        <Input value={lastName} onChange={(event) => setLastName(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">E-mail</label>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Telefone</label>
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Cargo</label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" />
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
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar contato"}
        </Button>
      </div>
    </form>
  );
}
