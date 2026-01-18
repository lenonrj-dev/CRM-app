"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActivityDTO, DealDTO, TicketDTO } from "@ateliux/shared";
import { listDeals } from "../../../features/crm/deals/api";
import { listTickets } from "../../../features/support/tickets/api";
import { listActivities } from "../../../features/crm/activities/api";
import { PageHeader } from "../../../components/shared/PageHeader";
import { RequirePermission } from "../../../components/shared/RequirePermission";
import { FiltersBar } from "../../../components/shared/FiltersBar";
import { StatsGrid } from "../../../components/shared/StatsGrid";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/Table";
import { formatCurrency, formatDate } from "../../../lib/utils";
import { formatEnumLabel } from "../../../lib/labels";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { useAuth } from "../../../features/auth/auth-context";
import { hasPermission } from "../../../config/rbac";

const filterOptions = ["Dia", "Semana", "Mês", "Ano"];

export default function DashboardPage() {
  const [filter, setFilter] = useState("Mês");
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const canReadDashboard = hasPermission(user?.role, "dashboard:read");
  const canReadCrm = hasPermission(user?.role, "crm:read");
  const canReadSupport = hasPermission(user?.role, "support:read");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !canReadDashboard) {
      setDeals([]);
      setTickets([]);
      setActivities([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const [dealData, ticketData, activityData] = await Promise.all([
          canReadCrm ? listDeals({ signal: controller.signal }) : Promise.resolve({ items: [] }),
          canReadSupport ? listTickets(undefined, { signal: controller.signal }) : Promise.resolve({ items: [] }),
          canReadCrm ? listActivities({ signal: controller.signal }) : Promise.resolve({ items: [] }),
        ]);
        setDeals(dealData.items);
        setTickets(ticketData.items);
        setActivities(activityData.items);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) {
          setDeals([]);
          setTickets([]);
          setActivities([]);
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("[dashboard] Erro ao carregar", { status });
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [authLoading, user, canReadDashboard, canReadCrm, canReadSupport]);

  const showRevenue = user ? !["VIEWER", "CLIENT"].includes(user.role) : false;

  const metrics = useMemo(() => {
    const revenue = deals
      .filter((deal) => deal.stage !== "LOST")
      .reduce((sum, deal) => sum + (deal.value ?? 0), 0);
    const openTickets = tickets.filter((ticket) => ["OPEN", "PENDING"].includes(ticket.status)).length;
    const today = new Date();
    const activitiesToday = activities.filter((activity) => {
      if (!activity.dueDate) return false;
      const date = new Date(activity.dueDate);
      return date.toDateString() === today.toDateString();
    }).length;

    return [
      { label: "Total de oportunidades", value: String(deals.length), trend: "Funil ativo" },
      {
        label: "Receita estimada",
        value: showRevenue ? formatCurrency(revenue) : "-",
        trend: "Baseado nas oportunidades abertas",
      },
      { label: "Chamados abertos", value: String(openTickets), trend: "Fila de suporte" },
      { label: "Atividades de hoje", value: String(activitiesToday), trend: "Foco do dia" },
    ];
  }, [deals, tickets, activities, showRevenue]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const label = date.toLocaleString("pt-BR", { month: "short" });
      return { label, value: 0 };
    });

    deals.forEach((deal) => {
      const date = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : new Date(deal.createdAt);
      const monthIndex = months.findIndex((item) => item.label === date.toLocaleString("pt-BR", { month: "short" }));
      if (monthIndex >= 0) {
        months[monthIndex].value += deal.value ?? 0;
      }
    });

    return months;
  }, [deals]);

  const recentDeals = deals.slice(0, 5);

  return (
    <RequirePermission permission="dashboard:read">
      <div className="space-y-6">
        <PageHeader
          title="Painel"
          subtitle="Pulso de vendas e suporte"
          actions={<FiltersBar options={filterOptions} value={filter} onChange={setFilter} />}
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando painel...</p> : null}

        <StatsGrid items={metrics} />

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Receita por mês</CardTitle>
                <p className="text-xs text-[var(--color-muted)]">Previsão do funil nos últimos 6 meses</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid h-56 grid-cols-6 items-end gap-4">
                {chartData.map((entry) => (
                  <div key={entry.label} className="flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-2xl bg-[var(--color-accent-soft)]"
                      style={{ height: `${Math.max(20, (entry.value / 200000) * 180)}px` }}
                    />
                    <span className="text-xs text-[var(--color-muted)]">{entry.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Atividades recentes</CardTitle>
                <p className="text-xs text-[var(--color-muted)]">Últimas tarefas e acompanhamentos</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-sm font-semibold">{activity.subject}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {formatEnumLabel(activity.type)} - {formatDate(activity.dueDate)}
                    </p>
                  </div>
                ))}
                {!activities.length ? (
                  <p className="text-sm text-[var(--color-muted)]">Nenhuma atividade ainda.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Oportunidades recentes</CardTitle>
              <p className="text-xs text-[var(--color-muted)]">Acompanhe as entradas mais recentes do funil</p>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oportunidade</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Fechamento</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {recentDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-semibold">{deal.name}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={deal.stage}
                        tone={deal.stage === "WON" ? "success" : deal.stage === "LOST" ? "danger" : "accent"}
                      />
                    </TableCell>
                    <TableCell>{showRevenue ? formatCurrency(deal.value) : "-"}</TableCell>
                    <TableCell>{formatDate(deal.expectedCloseDate)}</TableCell>
                  </TableRow>
                ))}
                {!recentDeals.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                      Nenhuma oportunidade ainda.
                    </TableCell>
                  </TableRow>
                ) : null}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}
