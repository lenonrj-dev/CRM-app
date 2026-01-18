"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CompanyDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { CompanyForm } from "../../../../features/crm/companies/CompanyForm";
import { createCompany, deleteCompany, listCompanies, updateCompany } from "../../../../features/crm/companies/api";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyDTO | null>(null);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await listCompanies();
      setCompanies(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const handleEdit = (company: CompanyDTO) => {
    setEditing(company);
    setDrawerOpen(true);
  };

  const handleSubmit = async (payload: Partial<CompanyDTO>) => {
    if (editing) {
      await updateCompany(editing.id, payload);
    } else {
      await createCompany(payload);
    }
    setDrawerOpen(false);
    await loadCompanies();
  };

  const handleDelete = async (companyId: string) => {
    await deleteCompany(companyId);
    await loadCompanies();
  };

  const canWrite = hasPermission(user?.role, "crm:write");
  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="crm:read">
      <div>
        <PageHeader
          title="Empresas"
          subtitle="Gerencie as organizações clientes"
          actions={
            <div className="flex items-center gap-2">
              {canExport ? <ExportButton type="crm:companies" /> : null}
              {canWrite ? (
                <Button onClick={handleCreate} pill>
                  Nova empresa
                </Button>
              ) : null}
            </div>
          }
        />

      {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando empresas...</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Segmento</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <tbody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-semibold">
                <Link href={`/crm/companies/${company.id}`} className="hover:text-[var(--color-accent-strong)]">
                  {company.name}
                </Link>
              </TableCell>
              <TableCell>{company.industry ?? "-"}</TableCell>
              <TableCell>{company.website ?? "-"}</TableCell>
              <TableCell>{company.tags?.join(", ") || "-"}</TableCell>
              <TableCell className="text-right">
                {canWrite ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(company)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(company.id)}>
                      Excluir
                    </Button>
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
          {!companies.length && !loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                Nenhuma empresa ainda.
              </TableCell>
            </TableRow>
          ) : null}
        </tbody>
      </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar empresa" : "Nova empresa"}
          onClose={() => setDrawerOpen(false)}
        >
          <CompanyForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
