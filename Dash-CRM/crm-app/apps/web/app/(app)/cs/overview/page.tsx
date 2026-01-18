"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompanyDTO, ContractDTO, CustomerSuccessProfileDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { StatsGrid } from "../../../../components/shared/StatsGrid";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { listCompanies } from "../../../../features/crm/companies/api";
import { listProfiles } from "../../../../features/cs/profiles/api";
import { listRenewals } from "../../../../features/cs/contracts/api";
import { formatDate, formatCurrency } from "../../../../lib/utils";
import { formatEnumLabel } from "../../../../lib/labels";

export default function CsOverviewPage() {
  const [profiles, setProfiles] = useState<CustomerSuccessProfileDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [renewals30, setRenewals30] = useState<ContractDTO[]>([]);
  const [renewals60, setRenewals60] = useState<ContractDTO[]>([]);
  const [renewals90, setRenewals90] = useState<ContractDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profilesData, companiesData, r30, r60, r90] = await Promise.all([
          listProfiles(),
          listCompanies(),
          listRenewals(30),
          listRenewals(60),
          listRenewals(90),
        ]);
        setProfiles(profilesData.items);
        setCompanies(companiesData.items);
        setRenewals30(r30.items);
        setRenewals60(r60.items);
        setRenewals90(r90.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const companyById = useMemo(() => {
    return companies.reduce<Record<string, CompanyDTO>>((acc, company) => {
      acc[company.id] = company;
      return acc;
    }, {});
  }, [companies]);

  const averageHealth =
    profiles.length > 0 ? Math.round(profiles.reduce((sum, profile) => sum + profile.healthScore, 0) / profiles.length) : 0;

  const atRisk = profiles.filter((profile) => profile.healthScore < 60);

  const stats = [
    { label: "Saúde média", value: `${averageHealth}` },
    { label: "Em risco", value: atRisk.length.toString(), trend: "Pontuação abaixo de 60" },
    { label: "Renovações 30d", value: renewals30.length.toString() },
    { label: "Renovações 60-90d", value: Math.max(renewals90.length - renewals60.length, 0).toString() },
  ];

  return (
    <RequirePermission permission="cs:read">
      <div className="space-y-6">
        <PageHeader title="Visão geral de CS" subtitle="Monitore saúde, implantação e renovações." />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando visão de CS...</p> : null}

        <StatsGrid items={stats} />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Contas em risco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {atRisk.map((profile) => (
                <div key={profile.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-sm font-semibold">{companyById[profile.companyId]?.name ?? "Empresa"}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Pontuação de saúde {profile.healthScore}</p>
                </div>
              ))}
              {!atRisk.length ? <p className="text-sm text-[var(--color-muted)]">Nenhuma conta em risco.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Renovações próximas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renewals30.slice(0, 5).map((contract) => (
                <div key={contract.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{companyById[contract.companyId]?.name ?? "Empresa"}</p>
                    <p className="text-xs text-[var(--color-muted)]">{formatDate(contract.endAt)}</p>
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {formatCurrency(contract.value)} - {formatEnumLabel(contract.renewalStatus)}
                  </p>
                </div>
              ))}
              {!renewals30.length ? <p className="text-sm text-[var(--color-muted)]">Nenhuma renovação próxima.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </RequirePermission>
  );
}
