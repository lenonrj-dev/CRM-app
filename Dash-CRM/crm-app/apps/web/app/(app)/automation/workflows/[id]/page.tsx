"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { WorkflowDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { WorkflowEditor } from "../../../../../features/automation/workflows/WorkflowEditor";
import { getWorkflow, updateWorkflow } from "../../../../../features/automation/workflows/api";
import { useAuth } from "../../../../../features/auth/auth-context";
import { hasPermission } from "../../../../../config/rbac";

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [workflow, setWorkflow] = useState<WorkflowDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const canWrite = hasPermission(user?.role, "automation:write");

  const loadWorkflow = async () => {
    setLoading(true);
    try {
      const data = await getWorkflow(params.id);
      setWorkflow(data.workflow);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [params.id]);

  const handleSubmit = async (payload: Partial<WorkflowDTO>) => {
    await updateWorkflow(params.id, payload);
    await loadWorkflow();
  };

  return (
    <RequirePermission permission="automation:read">
      <div className="space-y-6">
        <PageHeader
          title={workflow?.name ?? "Fluxo"}
          subtitle="Edite gatilhos, condições e ações."
          actions={
            <Link href="/automation/workflows" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para fluxos
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando fluxo...</p> : null}

        {workflow ? (
          canWrite ? (
            <WorkflowEditor
              initial={workflow}
              onSubmit={handleSubmit}
              onCancel={() => router.push("/automation/workflows")}
            />
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Você não tem permissão para editar este fluxo.</p>
          )
        ) : null}
      </div>
    </RequirePermission>
  );
}
