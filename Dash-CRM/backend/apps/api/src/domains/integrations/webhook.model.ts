import mongoose, { Schema } from "mongoose";

type WebhookSubscriptionDocument = {
  orgId: mongoose.Types.ObjectId;
  eventType: string;
  url: string;
  secret: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const WebhookSubscriptionSchema = new Schema<WebhookSubscriptionDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    eventType: { type: String, required: true },
    url: { type: String, required: true },
    secret: { type: String, required: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

WebhookSubscriptionSchema.index({ orgId: 1, eventType: 1 });

export const WebhookSubscription = mongoose.model<WebhookSubscriptionDocument>(
  "WebhookSubscription",
  WebhookSubscriptionSchema,
);
