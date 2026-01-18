"use client";

import { useEffect, useState } from "react";
import type { CompanyDTO, ContractDTO, CustomerSuccessProfileDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { ScoreBreakdown } from "../../../../../components/shared/ScoreBreakdown";
import { StatusBadge } from "../../../../../components/shared/StatusBadge";
import { Button } from "../../../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/Card";
import { Drawer } from "../../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/Table";
import { getCompanyOverview } from "../../../../../features/crm/companies/api";
import { useAuth } from "../../../../../features/auth/auth-context";
import { hasPermission } from "../../../../../config/rbac";
import { CSProfileForm } from "../../../../../features/cs/profiles/CSProfileForm";
import { createProfile, recalcHealth, updateProfile } from "../../../../../features/cs/profiles/api";
import { ContractForm } from "../../../../../features/cs/contracts/ContractForm";
import { createContract, deleteContract, updateContract } from "../../../../../features/cs/contracts/api";
import { formatCurrency, formatDate } from "../../../../../lib/utils";
import { formatEnumLabel } from "../../../../../lib/labels";

type Overview = Awaited<ReturnType<typeof getCompanyOverview>>;

const healthTone = (score: number) => {
  if (score >= 75) return "success";
  if (score >= 60) return "accent";
  if (score >= 45) return "warning";
  return "danger";
};

export default function CsAccountDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractDTO | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await getCompanyOverview(params.id);
      setOverview(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [params.id]);

  const canWriteProfile = hasPermission(user?.role, "cs:write");
  const canCreateContract = hasPermission(user?.role, "sales:write") || hasPermission(user?.role, "cs:write");
  const canManageContract = ["OWNER", "ADMIN", "MANAGER"].includes(user?.role ?? "");
  const canRecalc = ["OWNER", "ADMIN", "MANAGER"].includes(user?.role ?? "");

  const handleProfileSubmit = async (payload: Partial<CustomerSuccessProfileDTO>) => {
    if (!overview) return;
    if (overview.csProfile) {
      await updateProfile(overview.company.id, payload);
    } else {
      await createProfile({ ...payload, companyId: overview.company.id });
    }
    setProfileOpen(false);
    await loadOverview();
  };

  const handleContractSubmit = async (payload: Partial<ContractDTO>) => {
    if (editingContract) {
      await updateContract(editingContract.id, payload);
    } else {
      await createContract(payload);
    }
    setContractOpen(false);
    setEditingContract(null);
    await loadOverview();
  };

  const handleContractDelete = async (contractId: string) => {
    await deleteContract(contractId);
    await loadOverview();
  };

  const handleRecalc = async () => {
    if (!overview) return;
    await recalcHealth(overview.company.id);
    await loadOverview();
  };

  const company = overview?.company as CompanyDTO | undefined;
  const profile = overview?.csProfile as CustomerSuccessProfileDTO | null | undefined;
  const contracts = overview?.contracts ?? [];

  return (
    <RequirePermission permission="cs:read">
      <div className="space-y-6">
        <PageHeader
          title={company?.name ?? "Conta"}
          subtitle="Perfil de sucesso do cliente"
          actions={
            <div className="flex items-center gap-2">
              {canRecalc ? (
                <Button variant="secondary" size="sm" onClick={handleRecalc}>
                  Recalcular saúde
                </Button>
              ) : null}
              {canWriteProfile ? (
                <Button onClick={() => setProfileOpen(true)} pill>
                  {profile ? "Editar perfil" : "Criar perfil"}
                </Button>
              ) : null}
            </div>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando conta...</p> : null}

        {overview ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de saúde</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Ciclo de vida</p>
                      <p className="mt-1 text-lg font-semibold">
                        {profile ? formatEnumLabel(profile.lifecycleStage) : "Sem perfil"}
                      </p>
                    </div>
                    <StatusBadge
                      label={profile ? `${profile.healthScore}` : "-"}
                      tone={profile ? healthTone(profile.healthScore) : "neutral"}
                    />
                  </div>
                  {profile ? <ScoreBreakdown items={profile.healthBreakdown ?? []} /> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Checklist de implantação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile?.onboardingChecklist?.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <StatusBadge label={item.status} tone={item.status === "DONE" ? "success" : "accent"} />
                      </div>
                      {item.dueDate ? (
                        <p className="mt-2 text-xs text-[var(--color-muted)]">Prazo {formatDate(item.dueDate)}</p>
                      ) : null}
                    </div>
                  ))}
                  {!profile?.onboardingChecklist?.length ? (
                    <p className="text-sm text-[var(--color-muted)]">Nenhum item de implantação ainda.</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Contratos e renovações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canCreateContract ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingContract(null);
                      setContractOpen(true);
                    }}
                  >
                    Novo contrato
                  </Button>
                ) : null}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Renovação</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{formatEnumLabel(contract.status)}</TableCell>
                        <TableCell>{formatEnumLabel(contract.renewalStatus)}</TableCell>
                        <TableCell>{formatDate(contract.endAt)}</TableCell>
                        <TableCell>{formatCurrency(contract.value)}</TableCell>
                        <TableCell className="text-right">
                          {canManageContract ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setEditingContract(contract);
                                  setContractOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleContractDelete(contract.id)}>
                                Excluir
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!contracts.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                          Nenhum contrato cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Drawer open={profileOpen} title="Perfil de CS" onClose={() => setProfileOpen(false)}>
          <CSProfileForm
            initial={profile ?? undefined}
            onSubmit={handleProfileSubmit}
            onCancel={() => setProfileOpen(false)}
          />
        </Drawer>

        <Drawer
          open={contractOpen}
          title={editingContract ? "Editar contrato" : "Novo contrato"}
          onClose={() => setContractOpen(false)}
        >
          {company ? (
            <ContractForm
              initial={editingContract ?? undefined}
              companies={[company]}
              onSubmit={handleContractSubmit}
              onCancel={() => setContractOpen(false)}
            />
          ) : null}
        </Drawer>
      </div>
    </RequirePermission>
  );
}
