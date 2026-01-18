"use client";

import { useEffect, useState } from "react";
import type { ComplianceExportDTO, RetentionPolicyDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { getRetention, updateRetention, exportComplianceEntity, anonymizeComplianceEntity } from "../../../../features/settings/compliance/api";

export default function CompliancePage() {
  const [policy, setPolicy] = useState<RetentionPolicyDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("company");
  const [entityId, setEntityId] = useState("");
  const [exportResult, setExportResult] = useState<ComplianceExportDTO | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getRetention();
        setPolicy(data.policy);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!policy) return;
    const data = await updateRetention({
      auditLogDays: policy.auditLogDays,
      ticketDays: policy.ticketDays,
      marketingDays: policy.marketingDays,
    });
    setPolicy(data.policy);
  };

  const handleExport = async () => {
    if (!entityId) return;
    const data = await exportComplianceEntity(entity, entityId);
    setExportResult(data);
  };

  const handleAnonymize = async () => {
    if (!entityId) return;
    await anonymizeComplianceEntity(entity, entityId);
  };

  return (
    <RequirePermission permission="compliance:read">
      <div className="space-y-6">
        <PageHeader title="Conformidade" subtitle="Política de retenção e ferramentas LGPD/GDPR." />

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Política de retenção</h2>
            <Button onClick={handleSave} disabled={!policy}>
              Salvar política
            </Button>
          </div>
          {policy ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Logs de auditoria (dias)</label>
                <Input
                  type="number"
                  value={policy.auditLogDays}
                  onChange={(event) => setPolicy({ ...policy, auditLogDays: Number(event.target.value) })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Chamados (dias)</label>
                <Input
                  type="number"
                  value={policy.ticketDays}
                  onChange={(event) => setPolicy({ ...policy, ticketDays: Number(event.target.value) })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Marketing (dias)</label>
                <Input
                  type="number"
                  value={policy.marketingDays}
                  onChange={(event) => setPolicy({ ...policy, marketingDays: Number(event.target.value) })}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">{loading ? "Carregando política..." : "Nenhuma política definida."}</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Solicitações de dados</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Exporte ou anonimize registros de contato ou empresa.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Entidade</label>
              <select
                value={entity}
                onChange={(event) => setEntity(event.target.value)}
                className="mt-2 w-40 rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              >
                <option value="company">Empresa</option>
                <option value="contact">Contato</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">ID da entidade</label>
              <Input value={entityId} onChange={(event) => setEntityId(event.target.value)} className="mt-2" />
            </div>
            <Button variant="secondary" onClick={handleExport}>
              Exportar
            </Button>
            <Button variant="ghost" onClick={handleAnonymize}>
              Anonimizar
            </Button>
          </div>

          {exportResult ? (
            <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-4 text-xs">
              {JSON.stringify(exportResult.payload, null, 2)}
            </pre>
          ) : null}
        </Card>
      </div>
    </RequirePermission>
  );
}
