import type { ContractDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listContracts = () => apiFetch<{ items: ContractDTO[] }>("/cs/contracts");

export const listRenewals = (days = 90) =>
  apiFetch<{ items: ContractDTO[] }>(`/cs/renewals?days=${days}`);

export const createContract = (payload: Partial<ContractDTO>) =>
  apiFetch<{ contract: ContractDTO }>("/cs/contracts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateContract = (id: string, payload: Partial<ContractDTO>) =>
  apiFetch<{ contract: ContractDTO }>(`/cs/contracts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteContract = (id: string) =>
  apiFetch<{ ok: boolean }>(`/cs/contracts/${id}`, { method: "DELETE" });
