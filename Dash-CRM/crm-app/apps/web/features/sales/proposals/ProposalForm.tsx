"use client";

import { useMemo, useState } from "react";
import type { CatalogItemDTO, CompanyDTO, ContactDTO, DealDTO, ProposalDTO } from "@ateliux/shared";
import { discountTypeValues, proposalStatusValues } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { ProposalItemsEditor } from "./ProposalItemsEditor";
import { formatCurrency } from "../../../lib/utils";
import { formatEnumLabel } from "../../../lib/labels";

export function ProposalForm({
  initial,
  companies,
  contacts,
  deals,
  catalog,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ProposalDTO>;
  companies: CompanyDTO[];
  contacts: ContactDTO[];
  deals: DealDTO[];
  catalog: CatalogItemDTO[];
  onSubmit: (payload: Partial<ProposalDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [companyId, setCompanyId] = useState(initial?.companyId ?? companies[0]?.id ?? "");
  const [contactId, setContactId] = useState(initial?.contactId ?? "");
  const [dealId, setDealId] = useState(initial?.dealId ?? "");
  const [status, setStatus] = useState(initial?.status ?? proposalStatusValues[0]);
  const [discountType, setDiscountType] = useState(initial?.discountType ?? discountTypeValues[0]);
  const [discountValue, setDiscountValue] = useState(initial?.discountValue?.toString() ?? "0");
  const [validUntil, setValidUntil] = useState(initial?.validUntil?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState(
    initial?.items ?? [{ name: "", qty: 1, unitPrice: 0, total: 0 }],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const discount = Number(discountValue) || 0;
    if (discountType === "PERCENT") {
      return { subtotal, total: subtotal - subtotal * (discount / 100) };
    }
    if (discountType === "FIXED") {
      return { subtotal, total: subtotal - discount };
    }
    return { subtotal, total: subtotal };
  }, [items, discountType, discountValue]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        companyId,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        status,
        items: items.map((item) => ({
          ...item,
          total: item.qty * item.unitPrice,
        })),
        discountType: discountType as any,
        discountValue: Number(discountValue) || 0,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        notes: notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a proposta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
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
      </div>
      <div className="grid gap-3 md:grid-cols-2">
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
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Status</label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2">
            {proposalStatusValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ProposalItemsEditor items={items} catalog={catalog} onChange={setItems} />

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Tipo de desconto</label>
          <Select value={discountType} onChange={(event) => setDiscountType(event.target.value)} className="mt-2">
            {discountTypeValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Valor do desconto</label>
          <Input
            value={discountValue}
            onChange={(event) => setDiscountValue(event.target.value)}
            type="number"
            min="0"
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Válida até</label>
          <Input value={validUntil} onChange={(event) => setValidUntil(event.target.value)} type="date" className="mt-2" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Notas</label>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2" />
      </div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm">
        <p className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
        </p>
        <p className="mt-2 flex items-center justify-between">
          <span>Total</span>
          <span className="font-semibold">{formatCurrency(totals.total)}</span>
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar proposta"}
        </Button>
      </div>
    </form>
  );
}
