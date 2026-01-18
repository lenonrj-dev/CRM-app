"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogItemDTO, CompanyDTO, ContactDTO, DealDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../../components/shared/RequirePermission";
import { listCompanies } from "../../../../../features/crm/companies/api";
import { listContacts } from "../../../../../features/crm/contacts/api";
import { listDeals } from "../../../../../features/crm/deals/api";
import { listCatalogItems } from "../../../../../features/sales/catalog/api";
import { createProposal } from "../../../../../features/sales/proposals/api";
import { ProposalForm } from "../../../../../features/sales/proposals/ProposalForm";

export default function ProposalNewPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [catalog, setCatalog] = useState<CatalogItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [companiesData, contactsData, dealsData, catalogData] = await Promise.all([
          listCompanies(),
          listContacts(),
          listDeals(),
          listCatalogItems(),
        ]);
        setCompanies(companiesData.items);
        setContacts(contactsData.items);
        setDeals(dealsData.items);
        setCatalog(catalogData.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (payload: any) => {
    const data = await createProposal(payload);
    router.push(`/sales/proposals/${data.proposal.id}`);
  };

  return (
    <RequirePermission permission="sales:write">
      <div className="space-y-6">
        <PageHeader title="Nova proposta" subtitle="Crie uma proposta e solicite aprovações quando necessário." />
        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando formulário de proposta...</p> : null}
        {!loading ? (
          <ProposalForm
            companies={companies}
            contacts={contacts}
            deals={deals}
            catalog={catalog}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/sales/proposals")}
          />
        ) : null}
      </div>
    </RequirePermission>
  );
}
