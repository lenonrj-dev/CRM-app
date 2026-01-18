export const workflowTriggerValues = [
  "LEAD_CREATED",
  "DEAL_STAGE_CHANGED",
  "TICKET_CREATED",
  "HEALTH_SCORE_DROPPED",
  "RENEWAL_DUE_SOON",
] as const;
export type WorkflowTriggerType = typeof workflowTriggerValues[number];

export const workflowActionValues = [
  "CREATE_ACTIVITY",
  "ASSIGN_OWNER",
  "CREATE_TICKET",
  "NOTIFY_IN_APP",
  "UPDATE_DEAL_STAGE",
] as const;
export type WorkflowActionType = typeof workflowActionValues[number];

export type WorkflowCondition = {
  field: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";
  value: string | number | boolean;
};

export type WorkflowAction = {
  type: WorkflowActionType;
  payload: Record<string, unknown>;
};

export type WorkflowTrigger = {
  type: WorkflowTriggerType;
  params?: Record<string, unknown>;
};

export type WorkflowDTO = {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  createdBy: string;
  updatedAt?: string;
  createdAt: string;
};

export const workflowRunStatusValues = ["SUCCESS", "FAILED", "SKIPPED"] as const;
export type WorkflowRunStatus = typeof workflowRunStatusValues[number];

export type WorkflowRunDTO = {
  id: string;
  orgId: string;
  workflowId: string;
  status: WorkflowRunStatus;
  triggerEvent: string;
  result?: string;
  error?: string;
  executedAt: string;
};

export type NotificationDTO = {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  message: string;
  entity?: string;
  entityId?: string;
  readAt?: string;
  createdAt: string;
};
