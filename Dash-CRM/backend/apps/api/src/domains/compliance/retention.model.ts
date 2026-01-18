import mongoose, { Schema } from "mongoose";

type RetentionPolicyDocument = {
  orgId: mongoose.Types.ObjectId;
  auditLogDays: number;
  ticketDays: number;
  marketingDays: number;
  createdAt: Date;
  updatedAt: Date;
};

const RetentionPolicySchema = new Schema<RetentionPolicyDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    auditLogDays: { type: Number, default: 365 },
    ticketDays: { type: Number, default: 365 },
    marketingDays: { type: Number, default: 365 },
  },
  { timestamps: true },
);

export const RetentionPolicy = mongoose.model<RetentionPolicyDocument>(
  "RetentionPolicy",
  RetentionPolicySchema,
);
