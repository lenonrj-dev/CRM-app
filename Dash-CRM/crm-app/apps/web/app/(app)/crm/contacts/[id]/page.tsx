"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ActivityDTO, CompanyDTO, DealDTO } from "@ateliux/shared";
import { getContact } from "../../../../../features/crm/contacts/api";
import { listDeals } from "../../../../../features/crm/deals/api";
import { listActivities } from "../../../../../features/crm/activities/api";
import { listCompanies } from "../../../../../features/crm/companies/api";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { StatusBadge } from "../../../../../components/shared/StatusBadge";
import { formatCurrency, formatDate } from "../../../../../lib/utils";
import { formatEnumLabel } from "../../../../../lib/labels";

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const [contact, setContact] = useState<any>(null);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [contactData, dealsData, activitiesData, companyData] = await Promise.all([
          getContact(params.id),
          listDeals(),
          listActivities(),
          listCompanies(),
        ]);
        setContact(contactData.contact);
        setDeals(dealsData.items);
        setActivities(activitiesData.items);
        setCompanies(companyData.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const contactDeals = useMemo(() => deals.filter((deal) => deal.contactId === contact?.id), [deals, contact]);
  const contactActivities = useMemo(
    () => activities.filter((activity) => activity.contactId === contact?.id),
    [activities, contact],
  );
  const companyMap = useMemo(() => {
    return companies.reduce<Record<string, string>>((acc, company) => {
      acc[company.id] = company.name;
      return acc;
    }, {});
  }, [companies]);

  return (
    <RequirePermission permission="crm:read">
      <div className="space-y-6">
        <PageHeader
          title={contact ? `${contact.firstName} ${contact.lastName}` : "Contato"}
          subtitle="Perfil do contato"
          actions={
            <Link href="/crm/contacts" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para contatos
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando contato...</p> : null}

        {contact ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do contato</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">E-mail</p>
                  <p className="mt-1 font-semibold">{contact.email ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Telefone</p>
                  <p className="mt-1 font-semibold">{contact.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Cargo</p>
                  <p className="mt-1 font-semibold">{contact.title ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Empresa</p>
                  <p className="mt-1 font-semibold">
                    {contact.companyId ? companyMap[contact.companyId] ?? "-" : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Oportunidades relacionadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactDeals.map((deal) => (
                  <div key={deal.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{deal.name}</p>
                      <StatusBadge label={deal.stage} tone={deal.stage === "WON" ? "success" : "accent"} />
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      Valor {formatCurrency(deal.value)} - Fechamento {formatDate(deal.expectedCloseDate)}
                    </p>
                  </div>
                ))}
                {!contactDeals.length ? <p className="text-sm text-[var(--color-muted)]">Nenhuma oportunidade ainda.</p> : null}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Atividades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactActivities.map((activity) => (
                  <div key={activity.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="font-semibold">{activity.subject}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {formatEnumLabel(activity.type)} - {formatDate(activity.dueDate)}
                    </p>
                  </div>
                ))}
                {!contactActivities.length ? (
                  <p className="text-sm text-[var(--color-muted)]">Nenhuma atividade ainda.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}

