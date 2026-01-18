"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CompanyDTO, ContactDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { ContactForm } from "../../../../features/crm/contacts/ContactForm";
import { createContact, deleteContact, listContacts, updateContact } from "../../../../features/crm/contacts/api";
import { listCompanies } from "../../../../features/crm/companies/api";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ContactDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsData, companiesData] = await Promise.all([listContacts(), listCompanies()]);
      setContacts(contactsData.items);
      setCompanies(companiesData.items);
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

  const handleSubmit = async (payload: Partial<ContactDTO>) => {
    if (editing) {
      await updateContact(editing.id, payload);
    } else {
      await createContact(payload);
    }
    setDrawerOpen(false);
    await loadData();
  };

  const handleDelete = async (contactId: string) => {
    await deleteContact(contactId);
    await loadData();
  };

  const canWrite = hasPermission(user?.role, "crm:write");
  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="crm:read">
      <div>
        <PageHeader
          title="Contatos"
          subtitle="Gerencie pessoas na sua base de clientes"
          actions={
            <div className="flex items-center gap-2">
              {canExport ? <ExportButton type="crm:contacts" /> : null}
              {canWrite ? (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDrawerOpen(true);
                  }}
                  pill
                >
                  Novo contato
                </Button>
              ) : null}
            </div>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando contatos...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-semibold">
                  <Link href={`/crm/contacts/${contact.id}`} className="hover:text-[var(--color-accent-strong)]">
                    {contact.firstName} {contact.lastName}
                  </Link>
                </TableCell>
                <TableCell>{contact.email ?? "-"}</TableCell>
                <TableCell>{contact.companyId ? companyMap[contact.companyId] ?? "-" : "-"}</TableCell>
                <TableCell className="text-right">
                  {canWrite ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(contact);
                          setDrawerOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!contacts.length && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-[var(--color-muted)]">
                  Nenhum contato ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar contato" : "Novo contato"}
          onClose={() => setDrawerOpen(false)}
        >
          <ContactForm
            initial={editing ?? undefined}
            companies={companies}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
