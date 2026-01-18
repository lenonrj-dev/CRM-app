"use client";

import type { WorkflowActionType } from "@ateliux/shared";
import { workflowActionValues } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { formatEnumLabel } from "../../../lib/labels";

export type ActionDraft = {
  type: WorkflowActionType;
  payloadText: string;
};

export function WorkflowActionsEditor({
  actions,
  onChange,
}: {
  actions: ActionDraft[];
  onChange: (actions: ActionDraft[]) => void;
}) {
  const updateAction = (index: number, patch: Partial<ActionDraft>) => {
    onChange(actions.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Ações</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange([...actions, { type: workflowActionValues[0], payloadText: "{}" }])}
        >
          Adicionar ação
        </Button>
      </div>
      {actions.map((action, index) => (
        <div key={`${action.type}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4 space-y-3">
          <Select value={action.type} onChange={(event) => updateAction(index, { type: event.target.value as WorkflowActionType })}>
            {workflowActionValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
          <Textarea
            value={action.payloadText}
            onChange={(event) => updateAction(index, { payloadText: event.target.value })}
            rows={3}
            className="font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(actions.filter((_, idx) => idx !== index))}
            >
              Remover
            </Button>
          </div>
        </div>
      ))}
      {!actions.length ? <p className="text-sm text-[var(--color-muted)]">Nenhuma ação configurada.</p> : null}
    </div>
  );
}
