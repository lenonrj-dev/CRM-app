"use client";

import { useEffect, useState } from "react";
import type { CompanyDTO, ContractDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { FiltersBar } from "../../../../components/shared/FiltersBar";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listCompanies } from "../../../../features/crm/companies/api";
import { listRenewals } from "../../../../features/cs/contracts/api";
import { formatCurrency, formatDate } from "../../../../lib/utils";
import { formatEnumLabel } from "../../../../lib/labels";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

const filterOptions = ["30 dias", "60 dias", "90 dias"];
const mapDays = (value: string) => (value.startsWith("30") ? 30 : value.startsWith("60") ? 60 : 90);

export default function CsRenewalsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(filterOptions[0]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [renewalsData, companiesData] = await Promise.all([
          listRenewals(mapDays(filter)),
          listCompanies(),
        ]);
        setContracts(renewalsData.items);
        setCompanies(companiesData.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const companyById = companies.reduce<Record<string, CompanyDTO>>((acc, company) => {
    acc[company.id] = company;
    return acc;
  }, {});

  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="cs:read">
      <div className="space-y-6">
        <PageHeader
          title="Renovações"
          subtitle="Acompanhe renovações por datas de vencimento."
          actions={canExport ? <ExportButton type="cs:renewals" /> : null}
        />

        <FiltersBar options={filterOptions} value={filter} onChange={setFilter} />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando renovações...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Renovação</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-semibold">{companyById[contract.companyId]?.name ?? "Empresa"}</TableCell>
                <TableCell>{formatDate(contract.endAt)}</TableCell>
                <TableCell>{contract.value ? formatCurrency(contract.value) : "-"}</TableCell>
                <TableCell>{formatEnumLabel(contract.status)}</TableCell>
                <TableCell>{formatEnumLabel(contract.renewalStatus)}</TableCell>
              </TableRow>
            ))}
            {!contracts.length && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                  Nenhuma renovação neste período.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>
      </div>
    </RequirePermission>
  );
}
