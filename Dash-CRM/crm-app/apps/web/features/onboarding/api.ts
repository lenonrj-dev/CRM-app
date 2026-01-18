import type { OrganizationDTO } from "@ateliux/shared";
import { apiFetch } from "../../lib/api";

export const updateOnboarding = (payload: {
  orgName?: string;
  currency?: string;
  timezone?: string;
  onboardingCompleted?: boolean;
}) =>
  apiFetch<{ organization: OrganizationDTO }>("/onboarding", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const loadDemoData = () =>
  apiFetch<{ ok: boolean; organization: OrganizationDTO }>("/onboarding/demo", {
    method: "POST",
  });
