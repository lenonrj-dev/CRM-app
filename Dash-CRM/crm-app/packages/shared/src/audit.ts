export const auditActionValues = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE"] as const;
export type AuditAction = typeof auditActionValues[number];

export type AuditLogDTO = {
  id: string;
  orgId: string;
  userId: string;
  role: import("./permissions").Role;
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary?: string;
  changes?: Record<string, { from?: string | number | null; to?: string | number | null }>;
  ip?: string;
  userAgent?: string;
  hash?: string;
  createdAt: string;
};
