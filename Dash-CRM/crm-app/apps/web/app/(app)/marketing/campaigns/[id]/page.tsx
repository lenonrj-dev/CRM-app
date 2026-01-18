"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CampaignDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../../components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { getCampaign } from "../../../../../features/marketing/campaigns/api";
import { formatCurrency, formatDate } from "../../../../../lib/utils";

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<CampaignDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCampaign(params.id);
        setCampaign(data.campaign);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  return (
    <RequirePermission permission="marketing:read">
      <div className="space-y-6">
        <PageHeader
          title={campaign?.name ?? "Campanha"}
          subtitle="Detalhes da campanha e configuração de UTM."
          actions={
            <Link href="/marketing/campaigns" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para campanhas
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando campanha...</p> : null}

        {campaign ? (
          <Card>
            <CardHeader>
              <CardTitle>Visão geral da campanha</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Canal</p>
                <p className="mt-1 font-semibold">{campaign.channel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Orçamento</p>
                <p className="mt-1 font-semibold">{campaign.budget ? formatCurrency(campaign.budget) : "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Período</p>
                <p className="mt-1 font-semibold">
                  {formatDate(campaign.startAt)} - {formatDate(campaign.endAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Status</p>
                <StatusBadge label={campaign.status} tone={campaign.status === "ACTIVE" ? "success" : "accent"} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">UTM origem</p>
                <p className="mt-1 font-semibold">{campaign.utm?.source ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">UTM meio</p>
                <p className="mt-1 font-semibold">{campaign.utm?.medium ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">UTM campanha</p>
                <p className="mt-1 font-semibold">{campaign.utm?.campaign ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">UTM termo/conteúdo</p>
                <p className="mt-1 font-semibold">
                  {campaign.utm?.term ?? "-"} / {campaign.utm?.content ?? "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </RequirePermission>
  );
}
