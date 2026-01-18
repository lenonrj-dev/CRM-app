import mongoose, { Schema } from "mongoose";

type ApprovalRequestDocument = {
  orgId: mongoose.Types.ObjectId;
  entity: string;
  entityId: string;
  requestedBy: mongoose.Types.ObjectId;
  approverId: mongoose.Types.ObjectId;
  status: string;
  reason?: string;
  createdAt: Date;
  resolvedAt?: Date;
  updatedAt: Date;
};

const ApprovalRequestSchema = new Schema<ApprovalRequestDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true },
    reason: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export const ApprovalRequest = mongoose.model<ApprovalRequestDocument>("ApprovalRequest", ApprovalRequestSchema);
