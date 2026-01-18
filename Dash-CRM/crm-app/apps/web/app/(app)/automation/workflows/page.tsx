"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WorkflowDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listWorkflows, toggleWorkflow, createWorkflow } from "../../../../features/automation/workflows/api";
import { WorkflowEditor } from "../../../../features/automation/workflows/WorkflowEditor";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";
import { formatEnumLabel } from "../../../../lib/labels";

export default function AutomationWorkflowsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const data = await listWorkflows();
      setWorkflows(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleToggle = async (workflowId: string) => {
    await toggleWorkflow(workflowId);
    await loadWorkflows();
  };

  const handleCreate = async (payload: Partial<WorkflowDTO>) => {
    await createWorkflow(payload);
    setDrawerOpen(false);
    await loadWorkflows();
  };

  const canWrite = hasPermission(user?.role, "automation:write");

  return (
    <RequirePermission permission="automation:read">
      <div className="space-y-6">
        <PageHeader
          title="Fluxos"
          subtitle="Ative e gerencie automações."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => router.push("/automation/workflows/library")}>
                Abrir biblioteca
              </Button>
              {canWrite ? (
                <Button size="sm" onClick={() => setDrawerOpen(true)}>
                  Novo fluxo
                </Button>
              ) : null}
            </div>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando fluxos...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Gatilho</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell className="font-semibold">{workflow.name}</TableCell>
                <TableCell>{workflow.trigger?.type ? formatEnumLabel(workflow.trigger.type) : "-"}</TableCell>
                <TableCell>
                  <StatusBadge label={workflow.enabled ? "Ativo" : "Inativo"} tone={workflow.enabled ? "success" : "neutral"} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/automation/workflows/${workflow.id}`} className="text-sm font-semibold text-[var(--color-accent-strong)]">
                      Editar
                    </Link>
                    {canWrite ? (
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(workflow.id)}>
                        {workflow.enabled ? "Desativar" : "Ativar"}
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!workflows.length && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                  Nenhum fluxo configurado.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={drawerOpen} title="Novo fluxo" onClose={() => setDrawerOpen(false)}>
          <WorkflowEditor onSubmit={handleCreate} onCancel={() => setDrawerOpen(false)} />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
