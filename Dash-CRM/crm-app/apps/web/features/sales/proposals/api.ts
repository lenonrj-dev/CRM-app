import type { ProposalDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listProposals = (status?: string) =>
  apiFetch<{ items: ProposalDTO[] }>(status ? `/sales/proposals?status=${status}` : "/sales/proposals");

export const getProposal = (id: string) => apiFetch<{ proposal: ProposalDTO }>(`/sales/proposals/${id}`);

export const createProposal = (payload: Partial<ProposalDTO>) =>
  apiFetch<{ proposal: ProposalDTO }>("/sales/proposals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateProposal = (id: string, payload: Partial<ProposalDTO>) =>
  apiFetch<{ proposal: ProposalDTO }>(`/sales/proposals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteProposal = (id: string) =>
  apiFetch<{ ok: boolean }>(`/sales/proposals/${id}`, { method: "DELETE" });

export const requestApproval = (id: string) =>
  apiFetch<{ approvalId?: string; message?: string }>(`/sales/proposals/${id}/request-approval`, {
    method: "POST",
  });
