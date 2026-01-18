import type { DealDTO } from "@ateliux/shared";
import { apiFetch, type ApiFetchOptions } from "../../../lib/api";

export const listDeals = (options?: ApiFetchOptions) => apiFetch<{ items: DealDTO[] }>("/deals", options);

export const getDeal = (id: string) => apiFetch<{ deal: DealDTO }>(`/deals/${id}`);

export const createDeal = (payload: Partial<DealDTO>) =>
  apiFetch<{ deal: DealDTO }>("/deals", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateDeal = (id: string, payload: Partial<DealDTO>) =>
  apiFetch<{ deal: DealDTO }>(`/deals/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const moveDealStage = (id: string, payload: { stage: DealDTO["stage"]; lostReason?: string }) =>
  apiFetch<{ deal: DealDTO }>(`/deals/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteDeal = (id: string) => apiFetch<{ ok: boolean }>(`/deals/${id}`, { method: "DELETE" });