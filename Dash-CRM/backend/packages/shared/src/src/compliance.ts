export type RetentionPolicyDTO = {
  orgId: string;
  auditLogDays: number;
  ticketDays: number;
  marketingDays: number;
  updatedAt: string;
};

export type ComplianceExportDTO = {
  entity: string;
  id: string;
  payload: Record<string, unknown>;
};
