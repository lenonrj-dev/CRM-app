import { apiFetch } from "../../../lib/api";
import type { WebhookSubscriptionDTO } from "@ateliux/shared";

export const listWebhooks = () => apiFetch<{ items: WebhookSubscriptionDTO[] }>("/integrations/webhooks");

export const createWebhook = (payload: Partial<WebhookSubscriptionDTO>) =>
  apiFetch<{ webhook: WebhookSubscriptionDTO & { secret?: string } }>("/integrations/webhooks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateWebhook = (id: string, payload: Partial<WebhookSubscriptionDTO>) =>
  apiFetch<{ webhook: WebhookSubscriptionDTO }>(`/integrations/webhooks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteWebhook = (id: string) =>
  apiFetch(`/integrations/webhooks/${id}`, { method: "DELETE" });
