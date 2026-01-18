"use client";

import type { WorkflowCondition } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";

const operators = ["eq", "neq", "gt", "gte", "lt", "lte", "contains"] as const;
const operatorLabels: Record<(typeof operators)[number], string> = {
  eq: "Igual",
  neq: "Diferente",
  gt: "Maior que",
  gte: "Maior ou igual",
  lt: "Menor que",
  lte: "Menor ou igual",
  contains: "Contém",
};

export function WorkflowConditionsEditor({
  conditions,
  onChange,
}: {
  conditions: WorkflowCondition[];
  onChange: (conditions: WorkflowCondition[]) => void;
}) {
  const updateCondition = (index: number, patch: Partial<WorkflowCondition>) => {
    onChange(conditions.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Condições</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange([...conditions, { field: "", op: "eq", value: "" }])}
        >
          Adicionar condição
        </Button>
      </div>
      {conditions.map((condition, index) => (
        <div key={`${condition.field}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={condition.field}
              onChange={(event) => updateCondition(index, { field: event.target.value })}
              placeholder="Campo"
            />
            <Select value={condition.op} onChange={(event) => updateCondition(index, { op: event.target.value as any })}>
              {operators.map((op) => (
                <option key={op} value={op}>
                  {operatorLabels[op]}
                </option>
              ))}
            </Select>
            <Input
              value={String(condition.value ?? "")}
              onChange={(event) => updateCondition(index, { value: event.target.value })}
              placeholder="Valor"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(conditions.filter((_, idx) => idx !== index))}
            >
              Remover
            </Button>
          </div>
        </div>
      ))}
      {!conditions.length ? <p className="text-sm text-[var(--color-muted)]">Nenhuma condição configurada.</p> : null}
    </div>
  );
}
