"use client";

import { useEffect, useState } from "react";
import type { WorkflowRunDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listRuns } from "../../../../features/automation/runs/api";
import { formatDateTime } from "../../../../lib/utils";
import { formatEnumLabel } from "../../../../lib/labels";

const toneByStatus: Record<string, "success" | "danger" | "warning"> = {
  SUCCESS: "success",
  FAILED: "danger",
  SKIPPED: "warning",
};

export default function AutomationRunsPage() {
  const [runs, setRuns] = useState<WorkflowRunDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await listRuns();
        setRuns(data.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const parseTrigger = (value: string) => {
    try {
      const data = JSON.parse(value);
      return formatEnumLabel(`${data.triggerType}`);
    } catch {
      return formatEnumLabel(value);
    }
  };

  return (
    <RequirePermission permission="automation:read">
      <div className="space-y-6">
        <PageHeader title="Execuções de fluxo" subtitle="Histórico e resultados de execução." />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando execuções...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Gatilho</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Executado em</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <StatusBadge label={run.status} tone={toneByStatus[run.status] ?? "neutral"} />
                </TableCell>
                <TableCell>{parseTrigger(run.triggerEvent)}</TableCell>
                <TableCell>{run.result ?? run.error ?? "-"}</TableCell>
                <TableCell>{formatDateTime(run.executedAt)}</TableCell>
              </TableRow>
            ))}
            {!runs.length && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                  Nenhuma execução ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>
      </div>
    </RequirePermission>
  );
}
