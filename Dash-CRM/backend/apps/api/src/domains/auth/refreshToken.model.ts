import mongoose, { Schema } from "mongoose";

type RefreshTokenDocument = {
  userId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
};

const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

export const RefreshToken = mongoose.model<RefreshTokenDocument>("RefreshToken", RefreshTokenSchema);
