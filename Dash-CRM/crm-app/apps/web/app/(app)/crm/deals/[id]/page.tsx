"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CompanyDTO, ContactDTO, DealDTO, ProposalDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../../components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { getDeal } from "../../../../../features/crm/deals/api";
import { listCompanies } from "../../../../../features/crm/companies/api";
import { listContacts } from "../../../../../features/crm/contacts/api";
import { listProposals } from "../../../../../features/sales/proposals/api";
import { formatCurrency, formatDate } from "../../../../../lib/utils";
import { formatEnumLabel } from "../../../../../lib/labels";

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const [deal, setDeal] = useState<DealDTO | null>(null);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [proposals, setProposals] = useState<ProposalDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dealData, companiesData, contactsData, proposalsData] = await Promise.all([
        getDeal(params.id),
        listCompanies(),
        listContacts(),
        listProposals(),
      ]);
      setDeal(dealData.deal);
      setCompanies(companiesData.items);
      setContacts(contactsData.items);
      setProposals(proposalsData.items.filter((proposal) => proposal.dealId === params.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const company = companies.find((item) => item.id === deal?.companyId);
  const contact = contacts.find((item) => item.id === deal?.contactId);

  return (
    <RequirePermission permission="crm:read">
      <div className="space-y-6">
        <PageHeader
          title={deal?.name ?? "Oportunidade"}
          subtitle="Detalhes da oportunidade e propostas vinculadas."
          actions={
            <Link href="/crm/deals" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para oportunidades
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando oportunidade...</p> : null}

        {deal ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da oportunidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Empresa</p>
                    <p className="mt-1 font-semibold">{company?.name ?? "-"}</p>
                  </div>
                  <StatusBadge
                    label={deal.stage}
                    tone={deal.stage === "WON" ? "success" : deal.stage === "LOST" ? "danger" : "accent"}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Contato</p>
                    <p className="mt-1 text-sm font-semibold">
                      {contact ? `${contact.firstName} ${contact.lastName}` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Valor</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(deal.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Fechamento previsto</p>
                    <p className="mt-1 text-sm font-semibold">{formatDate(deal.expectedCloseDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Responsável</p>
                    <p className="mt-1 text-sm font-semibold">{deal.ownerId ?? "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Propostas vinculadas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <Link href={`/sales/proposals/${proposal.id}`} className="font-semibold hover:text-[var(--color-accent-strong)]">
                            #{proposal.id.slice(-6)}
                          </Link>
                        </TableCell>
                        <TableCell>{formatEnumLabel(proposal.status)}</TableCell>
                        <TableCell>{formatCurrency(proposal.total)}</TableCell>
                      </TableRow>
                    ))}
                    {!proposals.length ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-sm text-[var(--color-muted)]">
                          Nenhuma proposta vinculada a esta oportunidade.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}
