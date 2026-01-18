"use client";

import { useEffect, useState } from "react";
import type { ApprovalRequestDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { listApprovals, approveRequest, rejectRequest } from "../../../../features/sales/approvals/api";
import { ApprovalDecisionForm } from "../../../../features/sales/approvals/ApprovalDecisionForm";
import { formatDateTime } from "../../../../lib/utils";
import { useAuth } from "../../../../features/auth/auth-context";

export default function SalesApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApprovalRequestDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listApprovals();
      setApprovals(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as aprovações");
    } finally {
      setLoading(false);
    }
  };

  const canReview = ["ADMIN", "MANAGER"].includes(user?.role ?? "");

  useEffect(() => {
    if (canReview) {
      loadApprovals();
    }
  }, [canReview]);

  const handleApprove = async () => {
    if (!selected) return;
    await approveRequest(selected.id);
    setSelected(null);
    await loadApprovals();
  };

  const handleReject = async (reason?: string) => {
    if (!selected) return;
    await rejectRequest(selected.id, reason);
    setSelected(null);
    await loadApprovals();
  };

  return (
    <RequirePermission permission="sales:read">
      <div className="space-y-6">
        <PageHeader title="Aprovações" subtitle="Caixa de entrada do gestor para aprovações de desconto." />

        {!canReview ? (
          <p className="text-sm text-[var(--color-muted)]">Somente gestores podem revisar aprovações.</p>
        ) : null}

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando aprovações...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {canReview ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead>Resolvido em</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <tbody>
              {approvals.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell className="font-semibold">Proposta #{approval.entityId.slice(-6)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={approval.status}
                      tone={approval.status === "APPROVED" ? "success" : approval.status === "REJECTED" ? "danger" : "accent"}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(approval.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(approval.resolvedAt)}</TableCell>
                  <TableCell className="text-right">
                    {approval.status === "PENDING" ? (
                      <Button size="sm" variant="secondary" onClick={() => setSelected(approval)}>
                        Revisar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {!approvals.length && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                    Nenhuma solicitação de aprovação.
                  </TableCell>
                </TableRow>
              ) : null}
            </tbody>
          </Table>
        ) : null}

        <Drawer open={Boolean(selected)} title="Decisão" onClose={() => setSelected(null)}>
          {selected ? (
            <ApprovalDecisionForm
              onApprove={handleApprove}
              onReject={handleReject}
              onCancel={() => setSelected(null)}
            />
          ) : null}
        </Drawer>
      </div>
    </RequirePermission>
  );
}
