import mongoose, { Schema } from "mongoose";
import type { Role } from "@ateliux/shared";

type InviteDocument = {
  orgId: mongoose.Types.ObjectId;
  email: string;
  role: Role;
  token?: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const InviteSchema = new Schema<InviteDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true },
    token: { type: String },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

InviteSchema.index({ orgId: 1, email: 1 });

export const Invite = mongoose.model<InviteDocument>("Invite", InviteSchema);
