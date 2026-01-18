import { apiFetch } from "../../../lib/api";
import type { ComplianceExportDTO, RetentionPolicyDTO } from "@ateliux/shared";

export const getRetention = () => apiFetch<{ policy: RetentionPolicyDTO }>("/compliance/retention");

export const updateRetention = (payload: Partial<RetentionPolicyDTO>) =>
  apiFetch<{ policy: RetentionPolicyDTO }>("/compliance/retention", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const exportComplianceEntity = (entity: string, id: string) =>
  apiFetch<ComplianceExportDTO>(`/compliance/export/${entity}/${id}`);

export const anonymizeComplianceEntity = (entity: string, id: string) =>
  apiFetch(`/compliance/anonymize/${entity}/${id}`, { method: "POST" });
