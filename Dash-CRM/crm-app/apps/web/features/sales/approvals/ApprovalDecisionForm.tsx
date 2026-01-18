"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";

export function ApprovalDecisionForm({
  onApprove,
  onReject,
  onCancel,
}: {
  onApprove: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await onApprove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível aprovar");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      await onReject(reason || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível rejeitar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Motivo (opcional)</label>
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button variant="ghost" onClick={handleReject} type="button" disabled={loading}>
          Rejeitar
        </Button>
        <Button onClick={handleApprove} type="button" disabled={loading}>
          Aprovar
        </Button>
      </div>
    </div>
  );
}
