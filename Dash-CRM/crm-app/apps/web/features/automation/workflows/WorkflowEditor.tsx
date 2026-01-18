"use client";

import { useMemo, useState } from "react";
import type { WorkflowCondition, WorkflowDTO, WorkflowTriggerType } from "@ateliux/shared";
import { workflowTriggerValues } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { WorkflowConditionsEditor } from "./WorkflowConditionsEditor";
import { WorkflowActionsEditor, type ActionDraft } from "./WorkflowActionsEditor";
import { formatEnumLabel } from "../../../lib/labels";

const parsePayload = (value: string) => {
  if (!value.trim()) return {};
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export function WorkflowEditor({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: WorkflowDTO;
  onSubmit: (payload: Partial<WorkflowDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [trigger, setTrigger] = useState<WorkflowTriggerType>(
    initial?.trigger?.type ?? workflowTriggerValues[0],
  );
  const [conditions, setConditions] = useState<WorkflowCondition[]>(initial?.conditions ?? []);
  const [actions, setActions] = useState<ActionDraft[]>(
    initial?.actions?.map((action) => ({
      type: action.type,
      payloadText: JSON.stringify(action.payload ?? {}, null, 2),
    })) ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPayloadErrors = useMemo(
    () => actions.some((action) => parsePayload(action.payloadText) === null),
    [actions],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasPayloadErrors) {
      setError("Corrija os JSONs inválidos antes de salvar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        enabled,
        trigger: { type: trigger },
        conditions,
        actions: actions.map((action) => ({
          type: action.type,
          payload: parsePayload(action.payloadText) ?? {},
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o fluxo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nome</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Descrição</label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Gatilho</label>
          <Select value={trigger} onChange={(event) => setTrigger(event.target.value as WorkflowTriggerType)} className="mt-2">
            {workflowTriggerValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6 text-sm text-[var(--color-muted)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-accent)]"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Ativo
        </div>
      </div>

      <WorkflowConditionsEditor conditions={conditions} onChange={setConditions} />
      <WorkflowActionsEditor actions={actions} onChange={setActions} />

      {hasPayloadErrors ? <p className="text-xs text-red-600">Alguns dados contêm JSON inválido.</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar fluxo"}
        </Button>
      </div>
    </form>
  );
}
