"use client";

import { useEffect, useState } from "react";
import type { AttributionRowDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listAttribution } from "../../../../features/marketing/attribution/api";
import { formatCurrency } from "../../../../lib/utils";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

export default function MarketingAttributionPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AttributionRowDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const getSourceLabel = (source?: string | null) => {
    if (!source || source === "direct") return "direto";
    return source;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await listAttribution();
        setRows(data.items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="marketing:read">
      <div className="space-y-6">
        <PageHeader
          title="Atribuição"
          subtitle="Acompanhe o desempenho do primeiro e último toque nas campanhas."
          actions={canExport ? <ExportButton type="marketing:attribution" /> : null}
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando atribuição...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Meio</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Potenciais</TableHead>
              <TableHead>Oportunidades</TableHead>
              <TableHead>Receita</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {rows.map((row) => (
              <TableRow key={`${row.source}-${row.medium}-${row.campaign}`}>
                <TableCell>{getSourceLabel(row.source)}</TableCell>
                <TableCell>{row.medium ?? "-"}</TableCell>
                <TableCell>{row.campaign ?? "-"}</TableCell>
                <TableCell>{row.leads}</TableCell>
                <TableCell>{row.deals}</TableCell>
                <TableCell>{formatCurrency(row.revenue)}</TableCell>
              </TableRow>
            ))}
            {!rows.length && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-[var(--color-muted)]">
                  Sem dados de atribuição ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>
      </div>
    </RequirePermission>
  );
}
