"use client";

import type { CatalogItemDTO, ProposalItemDTO } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";

export function ProposalItemsEditor({
  items,
  catalog,
  onChange,
}: {
  items: ProposalItemDTO[];
  catalog: CatalogItemDTO[];
  onChange: (items: ProposalItemDTO[]) => void;
}) {
  const updateItem = (index: number, patch: Partial<ProposalItemDTO>) => {
    onChange(items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addItem = () =>
    onChange([...items, { name: "", qty: 1, unitPrice: 0, total: 0 }]);

  const removeItem = (index: number) => onChange(items.filter((_, idx) => idx !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Itens</p>
        <Button type="button" size="sm" variant="secondary" onClick={addItem}>
          Adicionar item
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              value={item.catalogItemId ?? ""}
              onChange={(event) => {
                const selected = catalog.find((entry) => entry.id === event.target.value);
                updateItem(index, {
                  catalogItemId: selected?.id,
                  name: selected?.name ?? item.name,
                  unitPrice: selected?.unitPrice ?? item.unitPrice,
                });
              }}
            >
              <option value="">Item personalizado</option>
              {catalog.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </Select>
            <Input
              value={item.name}
              onChange={(event) => updateItem(index, { name: event.target.value })}
              placeholder="Nome do item"
            />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              min="1"
              value={item.qty}
              onChange={(event) => updateItem(index, { qty: Number(event.target.value) })}
            />
            <Input
              type="number"
              min="0"
              value={item.unitPrice}
              onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
            />
            <Input
              value={(item.qty * item.unitPrice).toFixed(0)}
              readOnly
              className="bg-[var(--color-elevated)]"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)}>
              Remover
            </Button>
          </div>
        </div>
      ))}
      {!items.length ? <p className="text-sm text-[var(--color-muted)]">Nenhum item adicionado ainda.</p> : null}
    </div>
  );
}
