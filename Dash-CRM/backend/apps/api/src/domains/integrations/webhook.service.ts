import { createHmac } from "crypto";
import { WebhookSubscription } from "./webhook.model";

export const buildWebhookPayload = (event: {
  id: string;
  type: string;
  createdAt: Date;
  payload: Record<string, unknown>;
}) => ({
  id: event.id,
  type: event.type,
  timestamp: event.createdAt.toISOString(),
  data: event.payload,
});

const signPayload = (secret: string, body: string) =>
  createHmac("sha256", secret).update(body).digest("hex");

export const dispatchWebhooks = async (event: {
  orgId: string;
  id: string;
  type: string;
  createdAt: Date;
  payload: Record<string, unknown>;
}) => {
  const subscriptions = await WebhookSubscription.find({
    orgId: event.orgId,
    eventType: event.type,
    enabled: true,
  }).lean();

  if (!subscriptions.length) return;

  const payload = buildWebhookPayload(event);
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const signature = signPayload(subscription.secret, body);
      const response = await fetch(subscription.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Ateliux-Signature": signature,
        },
        body,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao enviar webhook ${subscription.url}: ${text || response.status}`);
      }
    }),
  );
};
