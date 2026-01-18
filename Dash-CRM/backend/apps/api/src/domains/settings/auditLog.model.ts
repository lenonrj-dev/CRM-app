import mongoose, { Schema } from "mongoose";
import type { AuditAction, Role } from "@ateliux/shared";

type AuditLogDocument = {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: Role;
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary?: string;
  changes?: Record<string, { from?: string | number | null; to?: string | number | null }>;
  ip?: string;
  userAgent?: string;
  hash?: string;
  createdAt: Date;
  updatedAt: Date;
};

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    summary: { type: String },
    changes: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    hash: { type: String },
  },
  { timestamps: true },
);

export const AuditLog = mongoose.model<AuditLogDocument>("AuditLog", AuditLogSchema);
