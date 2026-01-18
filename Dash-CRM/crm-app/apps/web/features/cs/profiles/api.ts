import type { CustomerSuccessProfileDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listProfiles = () => apiFetch<{ items: CustomerSuccessProfileDTO[] }>("/cs/profiles");

export const getProfile = (companyId: string) =>
  apiFetch<{ profile: CustomerSuccessProfileDTO }>(`/cs/profiles/${companyId}`);

export const createProfile = (payload: Partial<CustomerSuccessProfileDTO>) =>
  apiFetch<{ profile: CustomerSuccessProfileDTO }>("/cs/profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateProfile = (companyId: string, payload: Partial<CustomerSuccessProfileDTO>) =>
  apiFetch<{ profile: CustomerSuccessProfileDTO }>(`/cs/profiles/${companyId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const recalcHealth = (companyId: string) =>
  apiFetch<{ profile: CustomerSuccessProfileDTO }>(`/cs/health/recalculate/${companyId}`, {
    method: "POST",
  });
