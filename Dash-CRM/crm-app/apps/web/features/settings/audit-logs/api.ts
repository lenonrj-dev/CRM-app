import type { AuditLogDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listAuditLogs = (filters?: {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  start?: string;
  end?: string;
}) => {
  const search = new URLSearchParams();
  if (filters?.userId) search.set("userId", filters.userId);
  if (filters?.action) search.set("action", filters.action);
  if (filters?.entity) search.set("entity", filters.entity);
  if (filters?.entityId) search.set("entityId", filters.entityId);
  if (filters?.start) search.set("start", filters.start);
  if (filters?.end) search.set("end", filters.end);
  const query = search.toString();
  return apiFetch<{ items: AuditLogDTO[] }>(`/audit-logs${query ? `?${query}` : ""}`);
};
