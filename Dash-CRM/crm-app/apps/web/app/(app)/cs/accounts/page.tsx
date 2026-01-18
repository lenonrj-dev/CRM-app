"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CompanyDTO, CustomerSuccessProfileDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listCompanies } from "../../../../features/crm/companies/api";
import { listProfiles } from "../../../../features/cs/profiles/api";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";
import { formatEnumLabel } from "../../../../lib/labels";

const healthTone = (score: number) => {
  if (score >= 75) return "success";
  if (score >= 60) return "accent";
  if (score >= 45) return "warning";
  return "danger";
};

export default function CsAccountsPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [profiles, setProfiles] = useState<CustomerSuccessProfileDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [companiesData, profilesData] = await Promise.all([listCompanies(), listProfiles()]);
        setCompanies(companiesData.items);
        setProfiles(profilesData.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const profileByCompany = useMemo(() => {
    return profiles.reduce<Record<string, CustomerSuccessProfileDTO>>((acc, profile) => {
      acc[profile.companyId] = profile;
      return acc;
    }, {});
  }, [profiles]);

  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="cs:read">
      <div className="space-y-6">
        <PageHeader
          title="Contas"
          subtitle="Acompanhe ciclo de vida e saúde de cada cliente."
          actions={canExport ? <ExportButton type="cs:accounts" /> : null}
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando contas...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Ciclo de vida</TableHead>
              <TableHead>Saúde</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {companies.map((company) => {
              const profile = profileByCompany[company.id];
              return (
                <TableRow key={company.id}>
                  <TableCell className="font-semibold">{company.name}</TableCell>
                  <TableCell>{profile ? formatEnumLabel(profile.lifecycleStage) : "Sem perfil"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={profile ? `${profile.healthScore}` : "-"}
                      tone={profile ? healthTone(profile.healthScore) : "neutral"}
                    />
                  </TableCell>
                  <TableCell>{profile?.ownerId ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/cs/accounts/${company.id}`} className="text-sm font-semibold text-[var(--color-accent-strong)]">
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {!companies.length && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>
      </div>
    </RequirePermission>
  );
}
