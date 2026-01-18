"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WorkflowTemplateDTO } from "../../../../../features/automation/workflows/api";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Button } from "../../../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { installWorkflowTemplate, listWorkflowTemplates } from "../../../../../features/automation/workflows/api";
import { useAuth } from "../../../../../features/auth/auth-context";
import { hasPermission } from "../../../../../config/rbac";
import { formatEnumLabel } from "../../../../../lib/labels";

export default function WorkflowLibraryPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkflowTemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const canWrite = hasPermission(user?.role, "automation:write");

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await listWorkflowTemplates();
      setTemplates(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleInstall = async (templateId: string) => {
    await installWorkflowTemplate(templateId);
    await loadTemplates();
  };

  return (
    <RequirePermission permission="automation:read">
      <div className="space-y-6">
        <PageHeader
          title="Biblioteca de fluxos"
          subtitle="Instale modelos de automação prontos."
          actions={
            <Link href="/automation/workflows" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para fluxos
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando modelos...</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--color-muted)]">{template.description ?? "Fluxo de modelo"}</p>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  Gatilho: {template.trigger?.type ? formatEnumLabel(template.trigger.type) : "-"}
                </p>
                {canWrite ? (
                  <Button size="sm" onClick={() => handleInstall(template.id)}>
                    Instalar modelo
                  </Button>
                ) : (
                  <p className="text-xs text-[var(--color-muted)]">Sem permissão para instalar.</p>
                )}
              </CardContent>
            </Card>
          ))}
          {!templates.length && !loading ? (
            <Card>
              <CardContent className="p-6 text-sm text-[var(--color-muted)]">Nenhum modelo disponível.</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </RequirePermission>
  );
}
