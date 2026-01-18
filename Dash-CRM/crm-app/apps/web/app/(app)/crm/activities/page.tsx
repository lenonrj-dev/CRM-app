"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActivityDTO, CompanyDTO, ContactDTO, DealDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { ActivityForm } from "../../../../features/crm/activities/ActivityForm";
import { createActivity, deleteActivity, listActivities, updateActivity } from "../../../../features/crm/activities/api";
import { listCompanies } from "../../../../features/crm/companies/api";
import { listContacts } from "../../../../features/crm/contacts/api";
import { listDeals } from "../../../../features/crm/deals/api";
import { formatDate } from "../../../../lib/utils";
import { formatEnumLabel } from "../../../../lib/labels";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activityData, companyData, contactData, dealData] = await Promise.all([
        listActivities(),
        listCompanies(),
        listContacts(),
        listDeals(),
      ]);
      setActivities(activityData.items);
      setCompanies(companyData.items);
      setContacts(contactData.items);
      setDeals(dealData.items);
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

  const dealMap = useMemo(() => {
    return deals.reduce<Record<string, string>>((acc, deal) => {
      acc[deal.id] = deal.name;
      return acc;
    }, {});
  }, [deals]);

  const handleSubmit = async (payload: Partial<ActivityDTO>) => {
    if (editing) {
      await updateActivity(editing.id, payload);
    } else {
      await createActivity(payload);
    }
    setDrawerOpen(false);
    await loadData();
  };

  const handleDelete = async (activityId: string) => {
    await deleteActivity(activityId);
    await loadData();
  };

  const canWrite = hasPermission(user?.role, "crm:write");
  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="crm:read">
      <div>
        <PageHeader
          title="Atividades"
          subtitle="Tarefas, ligações, reuniões e anotações"
          actions={
            <div className="flex items-center gap-2">
              {canExport ? <ExportButton type="crm:activities" /> : null}
              {canWrite ? (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDrawerOpen(true);
                  }}
                  pill
                >
                  Nova atividade
                </Button>
              ) : null}
            </div>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando atividades...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assunto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Oportunidade</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-semibold">{activity.subject}</TableCell>
                <TableCell>{formatEnumLabel(activity.type)}</TableCell>
                <TableCell>{formatDate(activity.dueDate)}</TableCell>
                <TableCell>{activity.companyId ? companyMap[activity.companyId] ?? "-" : "-"}</TableCell>
                <TableCell>{activity.contactId ? contactMap[activity.contactId] ?? "-" : "-"}</TableCell>
                <TableCell>{activity.dealId ? dealMap[activity.dealId] ?? "-" : "-"}</TableCell>
                <TableCell className="text-right">
                  {canWrite ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(activity);
                          setDrawerOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(activity.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!activities.length && !loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-[var(--color-muted)]">
                  Nenhuma atividade ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar atividade" : "Nova atividade"}
          onClose={() => setDrawerOpen(false)}
        >
          <ActivityForm
            initial={editing ?? undefined}
            companies={companies}
            contacts={contacts}
            deals={deals}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
