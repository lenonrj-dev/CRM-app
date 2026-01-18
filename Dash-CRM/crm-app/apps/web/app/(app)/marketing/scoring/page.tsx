"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompanyDTO, ContactDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { ScoreBreakdown } from "../../../../components/shared/ScoreBreakdown";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listCompanies } from "../../../../features/crm/companies/api";
import { listContacts } from "../../../../features/crm/contacts/api";

export default function MarketingScoringPage() {
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactDTO | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [contactsData, companiesData] = await Promise.all([listContacts(), listCompanies()]);
        setContacts(contactsData.items);
        setCompanies(companiesData.items);
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

  return (
    <RequirePermission permission="marketing:read">
      <div className="space-y-6">
        <PageHeader title="Pontuação" subtitle="Pontuação de potenciais explicável com sinais de fit e intenção." />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando pontuação de potenciais...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Potencial</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Pontuação total</TableHead>
              <TableHead>Fit</TableHead>
              <TableHead>Intenção</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {contacts.map((contact) => {
              const score = contact.leadScore?.scoreTotal ?? 0;
              const companyName = contact.companyId ? companyById[contact.companyId]?.name : "-";
              const source = contact.attribution?.lastTouch?.utm?.source ?? "-";
              return (
                <TableRow key={contact.id}>
                  <TableCell className="font-semibold">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>{companyName ?? "-"}</TableCell>
                  <TableCell>{score}</TableCell>
                  <TableCell>{contact.leadScore?.fitScore ?? 0}</TableCell>
                  <TableCell>{contact.leadScore?.intentScore ?? 0}</TableCell>
                  <TableCell>{source}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" size="sm" onClick={() => setSelected(contact)}>
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!contacts.length && !loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-[var(--color-muted)]">
                  Nenhum potencial pontuado ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={Boolean(selected)} title="Detalhes da pontuação" onClose={() => setSelected(null)}>
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Potencial</p>
                <p className="mt-1 text-lg font-semibold">
                  {selected.firstName} {selected.lastName}
                </p>
              </div>
              <ScoreBreakdown items={selected.leadScore?.breakdown ?? []} />
            </div>
          ) : null}
        </Drawer>
      </div>
    </RequirePermission>
  );
}
