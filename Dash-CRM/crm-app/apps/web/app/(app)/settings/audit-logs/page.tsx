"use client";

import { useEffect, useState } from "react";
import type { AuditLogDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listAuditLogs } from "../../../../features/settings/audit-logs/api";
import { formatDateTime } from "../../../../lib/utils";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";
import { formatEnumLabel } from "../../../../lib/labels";

const entityOptions = [
  "auth",
  "company",
  "contact",
  "deal",
  "activity",
  "ticket",
  "user",
  "campaign",
  "utm",
  "cs-profile",
  "cs-health",
  "contract",
  "catalog-item",
  "proposal",
  "approval-request",
  "approval",
  "workflow",
  "workflow-run",
  "unit",
  "team",
  "territory",
  "membership",
  "webhook",
  "security",
  "compliance",
];
const actionOptions = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE"];

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [entityId, setEntityId] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selected, setSelected] = useState<AuditLogDTO | null>(null);

  const renderValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
  };
  const changeEntries = selected?.changes ? Object.entries(selected.changes) : [];

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await listAuditLogs({
        userId: userId || undefined,
        entityId: entityId || undefined,
        entity: entity || undefined,
        action: action || undefined,
        start: start ? new Date(start).toISOString() : undefined,
        end: end ? new Date(end).toISOString() : undefined,
      });
      setLogs(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userId, entity, action, start, end]);

  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="audit:read">
      <div>
        <PageHeader
          title="Logs de auditoria"
          subtitle="Acompanhe ações críticas no CRM"
          actions={canExport ? <ExportButton type="audit:logs" /> : null}
        />

        <div className="mb-4 grid gap-3 md:grid-cols-6">
          <Input placeholder="ID do usuário" value={userId} onChange={(event) => setUserId(event.target.value)} />
          <Input placeholder="ID da entidade" value={entityId} onChange={(event) => setEntityId(event.target.value)} />
          <Select value={entity} onChange={(event) => setEntity(event.target.value)}>
            <option value="">Todas as entidades</option>
            {entityOptions.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
          <Select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">Todas as ações</option>
            {actionOptions.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
          <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
          <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
        </div>

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando logs...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Resumo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                <TableCell className="text-xs">{log.userId}</TableCell>
                <TableCell>{formatEnumLabel(log.action)}</TableCell>
                <TableCell>{formatEnumLabel(log.entity)}</TableCell>
                <TableCell className="text-xs text-[var(--color-muted)]">{log.summary ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm" onClick={() => setSelected(log)}>
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!logs.length && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-[var(--color-muted)]">
                  Nenhum log de auditoria ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={Boolean(selected)} title="Detalhes do log" onClose={() => setSelected(null)}>
          {selected ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Resumo</p>
                <p className="mt-2 font-semibold">{selected.summary ?? "-"}</p>
                <div className="mt-3 grid gap-2 text-xs text-[var(--color-muted)]">
                  <p>Ação: {formatEnumLabel(selected.action)}</p>
                  <p>Entidade: {formatEnumLabel(selected.entity)}</p>
                  <p>ID da entidade: {selected.entityId ?? "-"}</p>
                  <p>Usuário: {selected.userId}</p>
                  <p>Perfil: {formatEnumLabel(selected.role)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Diferenças</p>
                {changeEntries.length ? (
                  <div className="mt-3 space-y-2">
                    {changeEntries.map(([field, diff]) => (
                      <div key={field} className="rounded-2xl border border-[var(--color-border)] bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{field}</p>
                        <div className="mt-2 text-xs text-[var(--color-muted)]">
                          <p>De: <span className="font-semibold text-[var(--color-ink)]">{renderValue(diff?.from)}</span></p>
                          <p>Para: <span className="font-semibold text-[var(--color-ink)]">{renderValue(diff?.to)}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">Nenhuma diferença registrada.</p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-xs text-[var(--color-muted)]">
                <p>IP: {selected.ip ?? "-"}</p>
                <p>Agente do usuário: {selected.userAgent ?? "-"}</p>
                <p>Hash: {selected.hash ?? "-"}</p>
              </div>
            </div>
          ) : null}
        </Drawer>
      </div>
    </RequirePermission>
  );
}
