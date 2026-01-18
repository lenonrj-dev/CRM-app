"use client";

import { useState } from "react";
import type { WebhookSubscriptionDTO } from "@ateliux/shared";
import { webhookEventValues } from "@ateliux/shared";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { formatEnumLabel } from "../../../lib/labels";

export function WebhookForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<WebhookSubscriptionDTO>;
  onSubmit: (payload: Partial<WebhookSubscriptionDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [eventType, setEventType] = useState(initial?.eventType ?? webhookEventValues[0]);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ eventType, url, enabled });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Evento</label>
        <Select value={eventType} onChange={(event) => setEventType(event.target.value)} className="mt-2">
          {webhookEventValues.map((value) => (
            <option key={value} value={value}>
              {formatEnumLabel(value)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">URL</label>
        <Input value={url} onChange={(event) => setUrl(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Ativo</label>
        <Select value={enabled ? "yes" : "no"} onChange={(event) => setEnabled(event.target.value === "yes")} className="mt-2">
          <option value="yes">Sim</option>
          <option value="no">Não</option>
        </Select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar webhook"}
        </Button>
      </div>
    </form>
  );
}
