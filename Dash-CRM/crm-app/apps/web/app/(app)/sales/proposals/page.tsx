"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProposalDTO } from "@ateliux/shared";
import { proposalStatusValues } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { FiltersBar } from "../../../../components/shared/FiltersBar";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/Button";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listProposals } from "../../../../features/sales/proposals/api";
import { formatCurrency, formatDate } from "../../../../lib/utils";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

const filters = ["Todas", ...proposalStatusValues];

export default function SalesProposalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(filters[0]);
  const canWrite = hasPermission(user?.role, "sales:write");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await listProposals(filter === "Todas" ? undefined : filter);
        setProposals(data.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  return (
    <RequirePermission permission="sales:read">
      <div className="space-y-6">
        <PageHeader
          title="Propostas"
          subtitle="Crie e acompanhe propostas com fluxo de aprovação."
          actions={
            canWrite ? (
              <Button pill onClick={() => router.push("/sales/proposals/new")}>
                Nova proposta
              </Button>
            ) : null
          }
        />

        <FiltersBar options={filters} value={filter} onChange={setFilter} />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando propostas...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proposta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Válida até</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell className="font-semibold">Proposta #{proposal.id.slice(-6)}</TableCell>
                <TableCell>
                  <StatusBadge label={proposal.status} tone={proposal.status === "ACCEPTED" ? "success" : proposal.status === "REJECTED" ? "danger" : "accent"} />
                </TableCell>
                <TableCell>{formatCurrency(proposal.total)}</TableCell>
                <TableCell>{formatDate(proposal.validUntil)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/sales/proposals/${proposal.id}`} className="text-sm font-semibold text-[var(--color-accent-strong)]">
                    Ver
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {!proposals.length && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                  Nenhuma proposta encontrada.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>
      </div>
    </RequirePermission>
  );
}
