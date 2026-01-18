"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompanyDTO, ContactDTO, DealDTO } from "@ateliux/shared";
import Link from "next/link";
import { dealStageValues } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Card } from "../../../../components/ui/Card";
import { Select } from "../../../../components/ui/Select";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { DealForm } from "../../../../features/crm/deals/DealForm";
import { createDeal, deleteDeal, listDeals, moveDealStage, updateDeal } from "../../../../features/crm/deals/api";
import { listCompanies } from "../../../../features/crm/companies/api";
import { listContacts } from "../../../../features/crm/contacts/api";
import { formatCurrency, formatDate } from "../../../../lib/utils";
import { formatEnumLabel } from "../../../../lib/labels";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

export default function DealsPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DealDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealData, companyData, contactData] = await Promise.all([
        listDeals(),
        listCompanies(),
        listContacts(),
      ]);
      setDeals(dealData.items);
      setCompanies(companyData.items);
      setContacts(contactData.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const companyMap = useMemo(() => {
    return companies.reduce<Record<string, string>>((acc, company) => {
      acc[company.id] = company.name;
      return acc;
    }, {});
  }, [companies]);

  const contactMap = useMemo(() => {
    return contacts.reduce<Record<string, string>>((acc, contact) => {
      acc[contact.id] = `${contact.firstName} ${contact.lastName}`;
      return acc;
    }, {});
  }, [contacts]);

  const groupedDeals = useMemo(() => {
    return dealStageValues.reduce<Record<string, DealDTO[]>>((acc, stage) => {
      acc[stage] = deals.filter((deal) => deal.stage === stage);
      return acc;
    }, {});
  }, [deals]);

  const handleSubmit = async (payload: Partial<DealDTO>) => {
    if (editing) {
      await updateDeal(editing.id, payload);
    } else {
      await createDeal(payload);
    }
    setDrawerOpen(false);
    await loadData();
  };

  const handleStageChange = async (dealId: string, stage: DealDTO["stage"]) => {
    await moveDealStage(dealId, { stage });
    await loadData();
  };

  const handleDelete = async (dealId: string) => {
    await deleteDeal(dealId);
    await loadData();
  };

  const canWrite = hasPermission(user?.role, "crm:write");
  const canExport = hasPermission(user?.role, "exports:read");
  const showValue = user ? !["VIEWER", "CLIENT"].includes(user.role) : false;

  return (
    <RequirePermission permission="crm:read">
      <div className="space-y-6">
        <PageHeader
          title="Oportunidades"
          subtitle="Funil por etapa e previsão de receita"
          actions={
            <div className="flex items-center gap-2">
              {canExport ? <ExportButton type="crm:deals" /> : null}
              {canWrite ? (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDrawerOpen(true);
                  }}
                  pill
                >
                  Nova oportunidade
                </Button>
              ) : null}
            </div>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando oportunidades...</p> : null}

        <div className="grid gap-4 xl:grid-cols-6">
          {dealStageValues.map((stage) => (
            <div key={stage} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {formatEnumLabel(stage)}
                </p>
                <span className="text-xs text-[var(--color-muted)]">{groupedDeals[stage]?.length ?? 0}</span>
              </div>
              <div className="space-y-3">
                {(groupedDeals[stage] ?? []).map((deal) => (
                  <Card key={deal.id} className="p-4">
                    <Link href={`/crm/deals/${deal.id}`} className="font-semibold hover:text-[var(--color-accent-strong)]">
                      {deal.name}
                    </Link>
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {showValue && deal.value !== undefined ? formatCurrency(deal.value) : "-"}
                    </p>
                    <Select
                      value={deal.stage}
                      onChange={(event) => handleStageChange(deal.id, event.target.value as DealDTO["stage"])}
                      className="mt-3"
                      disabled={!canWrite}
                    >
                      {dealStageValues.map((value) => (
                        <option key={value} value={value}>
                          {formatEnumLabel(value)}
                        </option>
                      ))}
                    </Select>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card>
          <div className="p-5">
            <h2 className="text-lg font-semibold">Todas as oportunidades</h2>
          </div>
          <div className="px-5 pb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oportunidade</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Fechamento</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <tbody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-semibold">
                      <Link href={`/crm/deals/${deal.id}`} className="hover:text-[var(--color-accent-strong)]">
                        {deal.name}
                      </Link>
                    </TableCell>
                    <TableCell>{deal.companyId ? companyMap[deal.companyId] ?? "-" : "-"}</TableCell>
                    <TableCell>{deal.contactId ? contactMap[deal.contactId] ?? "-" : "-"}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={deal.stage}
                        tone={deal.stage === "WON" ? "success" : deal.stage === "LOST" ? "danger" : "accent"}
                      />
                    </TableCell>
                    <TableCell>{showValue && deal.value !== undefined ? formatCurrency(deal.value) : "-"}</TableCell>
                    <TableCell>{formatDate(deal.expectedCloseDate)}</TableCell>
                    <TableCell className="text-right">
                      {canWrite ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditing(deal);
                              setDrawerOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(deal.id)}>
                            Excluir
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {!deals.length && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-sm text-[var(--color-muted)]">
                      Nenhuma oportunidade ainda.
                    </TableCell>
                  </TableRow>
                ) : null}
              </tbody>
            </Table>
          </div>
        </Card>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar oportunidade" : "Nova oportunidade"}
          onClose={() => setDrawerOpen(false)}
        >
          <DealForm
            initial={editing ?? undefined}
            companies={companies}
            contacts={contacts}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
