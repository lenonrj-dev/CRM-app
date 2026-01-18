import { apiFetch } from "../../../lib/api";
import type { SecurityPolicyDTO, SessionDTO, TwoFactorSetupDTO, TwoFactorStatusDTO } from "@ateliux/shared";

export const getSecurityPolicy = () => apiFetch<{ policy: SecurityPolicyDTO }>("/security/policies");

export const updateSecurityPolicy = (payload: Partial<SecurityPolicyDTO>) =>
  apiFetch<{ policy: SecurityPolicyDTO }>("/security/policies", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const listSessions = (userId?: string) =>
  apiFetch<{ items: SessionDTO[] }>(`/security/sessions${userId ? `?userId=${userId}` : ""}`);

export const revokeSession = (sessionId: string) =>
  apiFetch("/security/sessions/revoke", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });

export const revokeAllSessions = (userId?: string) =>
  apiFetch("/security/sessions/revoke-all", {
    method: "POST",
    body: JSON.stringify(userId ? { userId } : {}),
  });

export const setupTwoFactor = () => apiFetch<TwoFactorSetupDTO>("/security/2fa/setup", { method: "POST" });

export const verifyTwoFactor = (code: string) =>
  apiFetch<TwoFactorStatusDTO>("/security/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const disableTwoFactor = (code: string) =>
  apiFetch<{ enabled: boolean }>("/security/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
