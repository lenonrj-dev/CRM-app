"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CompanyDTO, ContactDTO, TicketDTO } from "@ateliux/shared";
import { ticketPriorityValues, ticketStatusValues } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Select } from "../../../../components/ui/Select";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { TicketForm } from "../../../../features/support/tickets/TicketForm";
import { createTicket, deleteTicket, listTickets, updateTicket } from "../../../../features/support/tickets/api";
import { listCompanies } from "../../../../features/crm/companies/api";
import { listContacts } from "../../../../features/crm/contacts/api";
import { formatDate } from "../../../../lib/utils";
import { formatEnumLabel } from "../../../../lib/labels";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TicketDTO | null>(null);

  const loadData = async (filters?: { status?: string; priority?: string }) => {
    setLoading(true);
    try {
      const [ticketData, companyData, contactData] = await Promise.all([
        listTickets(filters),
        listCompanies(),
        listContacts(),
      ]);
      setTickets(ticketData.items);
      setCompanies(companyData.items);
      setContacts(contactData.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData({ status: statusFilter || undefined, priority: priorityFilter || undefined });
  }, [statusFilter, priorityFilter]);

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

  const handleSubmit = async (payload: Partial<TicketDTO>) => {
    if (editing) {
      await updateTicket(editing.id, payload);
    } else {
      await createTicket(payload);
    }
    setDrawerOpen(false);
    await loadData({ status: statusFilter || undefined, priority: priorityFilter || undefined });
  };

  const handleDelete = async (ticketId: string) => {
    await deleteTicket(ticketId);
    await loadData({ status: statusFilter || undefined, priority: priorityFilter || undefined });
  };

  const canWrite = hasPermission(user?.role, "support:write");
  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="support:read">
      <div>
        <PageHeader
          title="Chamados"
          subtitle="Fila de suporte e problemas de clientes"
          actions={
            <div className="flex items-center gap-2">
              {canExport ? <ExportButton type="support:tickets" /> : null}
              {canWrite ? (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDrawerOpen(true);
                  }}
                  pill
                >
                  Novo chamado
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Todos os status</option>
            {ticketStatusValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
          <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="">Todas as prioridades</option>
            {ticketPriorityValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando chamados...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chamado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-semibold">
                  <Link href={`/support/tickets/${ticket.id}`} className="hover:text-[var(--color-accent-strong)]">
                    {ticket.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={ticket.status}
                    tone={ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "success" : "warning"}
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={ticket.priority}
                    tone={ticket.priority === "URGENT" ? "danger" : ticket.priority === "HIGH" ? "warning" : "neutral"}
                  />
                </TableCell>
                <TableCell>{ticket.companyId ? companyMap[ticket.companyId] ?? "-" : "-"}</TableCell>
                <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {canWrite ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(ticket);
                          setDrawerOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(ticket.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!tickets.length && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-[var(--color-muted)]">
                  Nenhum chamado ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar chamado" : "Novo chamado"}
          onClose={() => setDrawerOpen(false)}
        >
          <TicketForm
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
