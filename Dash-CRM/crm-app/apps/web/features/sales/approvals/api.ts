import type { ApprovalRequestDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listApprovals = () => apiFetch<{ items: ApprovalRequestDTO[] }>("/sales/approvals");

export const approveRequest = (id: string) =>
  apiFetch<{ approval: ApprovalRequestDTO }>(`/sales/approvals/${id}/approve`, { method: "POST" });

export const rejectRequest = (id: string, reason?: string) =>
  apiFetch<{ approval: ApprovalRequestDTO }>(`/sales/approvals/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
