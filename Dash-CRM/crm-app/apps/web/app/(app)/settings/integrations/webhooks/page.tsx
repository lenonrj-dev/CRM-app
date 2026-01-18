"use client";

import { useEffect, useState } from "react";
import type { WebhookSubscriptionDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Button } from "../../../../../components/ui/Button";
import { Drawer } from "../../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { WebhookForm } from "../../../../../features/settings/integrations/WebhookForm";
import { createWebhook, deleteWebhook, listWebhooks, updateWebhook } from "../../../../../features/settings/integrations/api";
import { formatEnumLabel } from "../../../../../lib/labels";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSubscriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookSubscriptionDTO | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const data = await listWebhooks();
      setWebhooks(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleSubmit = async (payload: Partial<WebhookSubscriptionDTO>) => {
    if (editing) {
      await updateWebhook(editing.id, payload);
    } else {
      const result = await createWebhook(payload);
      setSecret((result.webhook as any).secret ?? null);
    }
    setDrawerOpen(false);
    await loadWebhooks();
  };

  const handleDelete = async (id: string) => {
    await deleteWebhook(id);
    await loadWebhooks();
  };

  return (
    <RequirePermission permission="integrations:read">
      <div>
        <PageHeader
          title="Webhooks"
          subtitle="Envie eventos do CRM para sistemas externos."
          actions={
            <Button onClick={() => { setEditing(null); setSecret(null); setDrawerOpen(true); }} pill>
              Novo webhook
            </Button>
          }
        />

        {secret ? (
          <div className="mb-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-4 text-sm">
            Segredo gerado: <span className="font-semibold">{secret}</span>
          </div>
        ) : null}

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando webhooks...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {webhooks.map((hook) => (
              <TableRow key={hook.id}>
                <TableCell className="font-semibold">{formatEnumLabel(hook.eventType)}</TableCell>
                <TableCell className="text-xs text-[var(--color-muted)]">{hook.url}</TableCell>
                <TableCell>{hook.enabled ? "Ativado" : "Desativado"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setEditing(hook); setSecret(null); setDrawerOpen(true); }}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(hook.id)}>
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!webhooks.length && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                  Nenhum webhook configurado ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={drawerOpen} title={editing ? "Editar webhook" : "Novo webhook"} onClose={() => setDrawerOpen(false)}>
          <WebhookForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
