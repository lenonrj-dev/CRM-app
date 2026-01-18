"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CompanyDTO, ContactDTO, DealDTO, ProposalDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../../components/shared/StatusBadge";
import { Button } from "../../../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { listCompanies } from "../../../../../features/crm/companies/api";
import { listContacts } from "../../../../../features/crm/contacts/api";
import { listDeals } from "../../../../../features/crm/deals/api";
import { getProposal, requestApproval, updateProposal } from "../../../../../features/sales/proposals/api";
import { formatCurrency, formatDate } from "../../../../../lib/utils";
import { formatEnumLabel } from "../../../../../lib/labels";
import { useAuth } from "../../../../../features/auth/auth-context";
import { hasPermission } from "../../../../../config/rbac";

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [proposal, setProposal] = useState<ProposalDTO | null>(null);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const [proposalData, companiesData, contactsData, dealsData] = await Promise.all([
        getProposal(params.id),
        listCompanies(),
        listContacts(),
        listDeals(),
      ]);
      setProposal(proposalData.proposal);
      setCompanies(companiesData.items);
      setContacts(contactsData.items);
      setDeals(dealsData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a proposta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposal();
  }, [params.id]);

  const company = companies.find((item) => item.id === proposal?.companyId);
  const contact = contacts.find((item) => item.id === proposal?.contactId);
  const deal = deals.find((item) => item.id === proposal?.dealId);
  const canWrite = hasPermission(user?.role, "sales:write");

  const handleStatus = async (status: ProposalDTO["status"]) => {
    if (!proposal) return;
    try {
      await updateProposal(proposal.id, { status });
      await loadProposal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a proposta");
    }
  };

  const handleRequestApproval = async () => {
    if (!proposal) return;
    try {
      await requestApproval(proposal.id);
      await loadProposal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível solicitar aprovação");
    }
  };

  return (
    <RequirePermission permission="sales:read">
      <div className="space-y-6">
        <PageHeader
          title={`Proposta #${proposal?.id.slice(-6) ?? ""}`}
          subtitle="Revise itens, descontos e aprovações da proposta."
          actions={
            <Link href="/sales/proposals" className="text-sm font-semibold text-[var(--color-muted)]">
              Voltar para propostas
            </Link>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando proposta...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {proposal ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da proposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Empresa</p>
                    <p className="mt-1 font-semibold">{company?.name ?? "Empresa"}</p>
                  </div>
                  <StatusBadge
                    label={proposal.status}
                    tone={proposal.status === "ACCEPTED" ? "success" : proposal.status === "REJECTED" ? "danger" : "accent"}
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
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Oportunidade</p>
                    <p className="mt-1 text-sm font-semibold">{deal?.name ?? "-"}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Válida até</p>
                    <p className="mt-1 text-sm font-semibold">{formatDate(proposal.validUntil)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Desconto</p>
                    <p className="mt-1 text-sm font-semibold">
                      {proposal.discountType === "NONE"
                        ? "Nenhum"
                        : `${formatEnumLabel(proposal.discountType)} ${proposal.discountValue ?? "-"}`}
                    </p>
                  </div>
                </div>
                {canWrite ? (
                  <div className="flex flex-wrap gap-2">
                    {proposal.status === "DRAFT" ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={handleRequestApproval}>
                          Solicitar aprovação
                        </Button>
                        <Button size="sm" onClick={() => handleStatus("SENT")}>
                          Enviar proposta
                        </Button>
                      </>
                    ) : null}
                    {proposal.status === "SENT" ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleStatus("ACCEPTED")}>
                          Marcar como aceita
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleStatus("REJECTED")}>
                          Marcar como rejeitada
                        </Button>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-muted)]">Sem permissão para alterar o status da proposta.</p>
                )}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Totais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCurrency(proposal.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{formatCurrency(proposal.total)}</span>
                </div>
                {proposal.notes ? (
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3 text-xs text-[var(--color-muted)]">
                    {proposal.notes}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Itens</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Unitário</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {proposal.items.map((item, index) => (
                      <TableRow key={`${item.name}-${index}`}>
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
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
