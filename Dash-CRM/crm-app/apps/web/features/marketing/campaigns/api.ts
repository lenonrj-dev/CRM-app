import type { CampaignDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listCampaigns = () => apiFetch<{ items: CampaignDTO[] }>("/marketing/campaigns");

export const getCampaign = (id: string) =>
  apiFetch<{ campaign: CampaignDTO }>(`/marketing/campaigns/${id}`);

export const createCampaign = (payload: Partial<CampaignDTO>) =>
  apiFetch<{ campaign: CampaignDTO }>("/marketing/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateCampaign = (id: string, payload: Partial<CampaignDTO>) =>
  apiFetch<{ campaign: CampaignDTO }>(`/marketing/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteCampaign = (id: string) =>
  apiFetch<{ ok: boolean }>(`/marketing/campaigns/${id}`, { method: "DELETE" });
