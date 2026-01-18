export const webhookEventValues = [
  "lead.created",
  "deal.updated",
  "ticket.created",
  "proposal.approved",
  "workflow.run",
] as const;
export type WebhookEventType = typeof webhookEventValues[number];

export type WebhookSubscriptionDTO = {
  id: string;
  orgId: string;
  eventType: WebhookEventType;
  url: string;
  enabled: boolean;
  secretHint?: string;
  createdAt: string;
  updatedAt: string;
};
