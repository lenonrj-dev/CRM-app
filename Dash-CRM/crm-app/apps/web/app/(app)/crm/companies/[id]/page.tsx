"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TimelineEvent } from "@ateliux/shared";
import { getCompanyOverview } from "../../../../../features/crm/companies/api";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { StatusBadge } from "../../../../../components/shared/StatusBadge";
import { ScoreBreakdown } from "../../../../../components/shared/ScoreBreakdown";
import { formatCurrency, formatDate, formatDateTime } from "../../../../../lib/utils";
import { formatEnumLabel } from "../../../../../lib/labels";

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [state, setState] = useState<Awaited<ReturnType<typeof getCompanyOverview>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCompanyOverview(params.id);
        setState(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const timeline = (state?.timeline ?? []) as TimelineEvent[];
  const nextRenewal = state?.contracts?.slice().sort((a, b) => (a.endAt > b.endAt ? 1 : -1))[0];

  return (
    <RequirePermission permission="crm:read">
      <div className="space-y-6">
        <PageHeader
          title={state?.company.name ?? "Empresa"}
          subtitle="Visão 360 do cliente"
          actions={
            <Link href="/crm/companies" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para empresas
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando empresa...</p> : null}

        {state ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Visão geral da empresa</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Segmento</p>
                    <p className="mt-1 font-semibold">{state.company.industry ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Site</p>
                    <p className="mt-1 font-semibold">{state.company.website ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Porte</p>
                    <p className="mt-1 font-semibold">{state.company.size ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Tags</p>
                    <p className="mt-1 font-semibold">{state.company.tags?.join(", ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Origem</p>
                    <p className="mt-1 font-semibold">{formatEnumLabel(state.company.createdFrom ?? "-")}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Último toque</p>
                    <p className="mt-1 font-semibold">{state.company.attribution?.lastTouch?.utm?.source ?? "-"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contatos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                      <p className="font-semibold">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">{contact.title ?? "-"}</p>
                    </div>
                  ))}
                  {!state.contacts.length ? <p className="text-sm text-[var(--color-muted)]">Nenhum contato ainda.</p> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Oportunidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.deals.map((deal) => (
                    <div key={deal.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{deal.name}</p>
                        <StatusBadge
                          label={deal.stage}
                          tone={deal.stage === "WON" ? "success" : deal.stage === "LOST" ? "danger" : "accent"}
                        />
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        Valor: {formatCurrency(deal.value)} - Fechamento {formatDate(deal.expectedCloseDate)}
                      </p>
                    </div>
                  ))}
                  {!state.deals.length ? <p className="text-sm text-[var(--color-muted)]">Nenhuma oportunidade ainda.</p> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atividades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.activities.map((activity) => (
                    <div key={activity.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                      <p className="font-semibold">{activity.subject}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {formatEnumLabel(activity.type)} - {formatDate(activity.dueDate)}
                      </p>
                    </div>
                  ))}
                  {!state.activities.length ? (
                    <p className="text-sm text-[var(--color-muted)]">Nenhuma atividade ainda.</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chamados de suporte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.tickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{ticket.title}</p>
                        <StatusBadge
                          label={ticket.status}
                          tone={ticket.status === "RESOLVED" ? "success" : ticket.status === "CLOSED" ? "neutral" : "accent"}
                        />
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">{formatEnumLabel(ticket.priority)}</p>
                    </div>
                  ))}
                  {!state.tickets.length ? (
                    <p className="text-sm text-[var(--color-muted)]">Nenhum chamado ainda.</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sucesso do cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {state.csProfile ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Ciclo de vida</p>
                          <p className="mt-1 font-semibold">{formatEnumLabel(state.csProfile.lifecycleStage)}</p>
                        </div>
                        <StatusBadge
                          label={`${state.csProfile.healthScore}`}
                          tone={state.csProfile.healthScore >= 75 ? "success" : state.csProfile.healthScore >= 60 ? "accent" : "warning"}
                        />
                      </div>
                      {nextRenewal ? (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Próxima renovação</p>
                          <p className="mt-1 font-semibold">{formatDate(nextRenewal.endAt)}</p>
                        </div>
                      ) : null}
                      <ScoreBreakdown items={state.csProfile.healthBreakdown ?? []} />
                      <Link href={`/cs/accounts/${state.company.id}`} className="text-sm font-semibold text-[var(--color-accent-strong)]">
                        Ver perfil de CS
                      </Link>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)]">Nenhum perfil de CS ainda.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Linha do tempo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timeline.map((event) => (
                    <div key={event.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                        {formatEnumLabel(event.type)}
                      </p>
                      <p className="mt-1 font-semibold">{event.title}</p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">{formatDateTime(event.occurredAt)}</p>
                      {event.description ? <p className="mt-2 text-sm">{event.description}</p> : null}
                    </div>
                  ))}
                  {!timeline.length ? <p className="text-sm text-[var(--color-muted)]">Nenhum evento na linha do tempo.</p> : null}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}
