"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TicketDTO } from "@ateliux/shared";
import { getTicket, addTicketComment } from "../../../../../features/support/tickets/api";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Button } from "../../../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { StatusBadge } from "../../../../../components/shared/StatusBadge";
import { Textarea } from "../../../../../components/ui/Textarea";
import { formatDateTime } from "../../../../../lib/utils";
import { useAuth } from "../../../../../features/auth/auth-context";
import { hasPermission } from "../../../../../config/rbac";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const data = await getTicket(params.id);
      setTicket(data.ticket);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [params.id]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await addTicketComment(params.id, { body: comment, isInternal: internal });
      setComment("");
      setInternal(false);
      await loadTicket();
    } finally {
      setSubmitting(false);
    }
  };

  const canWrite = hasPermission(user?.role, "support:write");

  return (
    <RequirePermission permission="support:read">
      <div className="space-y-6">
        <PageHeader
          title={ticket?.title ?? "Chamado"}
          subtitle="Detalhes do chamado de suporte"
          actions={
            <Link href="/support/tickets" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para chamados
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando chamado...</p> : null}

        {ticket ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Visão geral do chamado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={ticket.status}
                    tone={ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "success" : "warning"}
                  />
                  <StatusBadge
                    label={ticket.priority}
                    tone={ticket.priority === "URGENT" ? "danger" : ticket.priority === "HIGH" ? "warning" : "neutral"}
                  />
                </div>
                <p className="text-sm text-[var(--color-muted)]">{ticket.description ?? "Sem descrição."}</p>
              </CardContent>
            </Card>

            {canWrite ? (
              <Card>
                <CardHeader>
                  <CardTitle>Novo comentário</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={comment} onChange={(event) => setComment(event.target.value)} />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                    <input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} />
                    Nota interna
                  </label>
                  <Button onClick={handleComment} disabled={submitting}>
                    {submitting ? "Adicionando..." : "Adicionar comentário"}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Comentários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.comments?.map((commentItem) => (
                  <div key={commentItem.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-sm">{commentItem.body}</p>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {commentItem.isInternal ? "Interno" : "Cliente"} - {formatDateTime(commentItem.createdAt)}
                    </p>
                  </div>
                ))}
                {!ticket.comments?.length ? (
                  <p className="text-sm text-[var(--color-muted)]">Nenhum comentário ainda.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}

