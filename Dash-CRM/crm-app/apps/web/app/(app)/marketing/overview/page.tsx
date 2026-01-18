"use client";

import { useEffect, useMemo, useState } from "react";
import type { AttributionRowDTO, ContactDTO, DealDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { StatsGrid } from "../../../../components/shared/StatsGrid";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listContacts } from "../../../../features/crm/contacts/api";
import { listDeals } from "../../../../features/crm/deals/api";
import { listAttribution } from "../../../../features/marketing/attribution/api";
import { listCampaigns } from "../../../../features/marketing/campaigns/api";

export default function MarketingOverviewPage() {
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [attribution, setAttribution] = useState<AttributionRowDTO[]>([]);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const getSourceLabel = (source?: string | null) => {
    if (!source || source === "direct") return "direto";
    return source;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [contactsData, dealsData, attributionData, campaignsData] = await Promise.all([
          listContacts(),
          listDeals(),
          listAttribution(),
          listCampaigns(),
        ]);
        setContacts(contactsData.items);
        setDeals(dealsData.items);
        setAttribution(attributionData.items);
        setCampaignsCount(campaignsData.items.length);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalLeads = contacts.length;
    const mql = contacts.filter((contact) => (contact.leadScore?.scoreTotal ?? 0) >= 60).length;
    const sql = deals.filter((deal) => ["PROPOSAL", "NEGOTIATION", "WON"].includes(deal.stage)).length;
    const conversion = totalLeads ? Math.round((sql / totalLeads) * 100) : 0;

    return [
      { label: "Total de potenciais", value: totalLeads.toString(), trend: `${campaignsCount} campanhas ativas` },
      { label: "MQL", value: mql.toString(), trend: "Pontuação >= 60" },
      { label: "SQL", value: sql.toString(), trend: "Oportunidades em proposta+" },
      { label: "Conversão", value: `${conversion}%`, trend: "Potencial para SQL" },
    ];
  }, [contacts, deals, campaignsCount]);

  const topRows = useMemo(
    () => [...attribution].sort((a, b) => b.leads - a.leads).slice(0, 5),
    [attribution],
  );

  return (
    <RequirePermission permission="marketing:read">
      <div className="space-y-6">
        <PageHeader
          title="Visão geral de marketing"
          subtitle="Desempenho por canal, conversão do funil e impacto das campanhas."
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando dados de marketing...</p> : null}

        <StatsGrid items={stats} />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Principais canais de aquisição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRows.map((row) => (
                <div key={`${row.source}-${row.medium}-${row.campaign}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {getSourceLabel(row.source)} / {row.medium ?? "-"}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">{row.campaign ?? "Sem campanha"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{row.leads} potenciais</p>
                      <p className="text-xs text-[var(--color-muted)]">{row.deals} oportunidades</p>
                    </div>
                  </div>
                </div>
              ))}
              {!topRows.length ? <p className="text-sm text-[var(--color-muted)]">Sem dados de atribuição ainda.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impacto das campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Potenciais</TableHead>
                    <TableHead>Oportunidades</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {topRows.map((row) => (
                    <TableRow key={`${row.source}-${row.campaign}-table`}>
                      <TableCell>{getSourceLabel(row.source)}</TableCell>
                      <TableCell>{row.campaign ?? "-"}</TableCell>
                      <TableCell>{row.leads}</TableCell>
                      <TableCell>{row.deals}</TableCell>
                    </TableRow>
                  ))}
                  {!topRows.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                        Nenhuma campanha registrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequirePermission>
  );
}
