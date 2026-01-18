import mongoose, { Schema } from "mongoose";

type PasswordPolicy = {
  minLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
};

type SecurityPolicyDocument = {
  orgId: mongoose.Types.ObjectId;
  password: PasswordPolicy;
  sessionTtlDays: number;
  requireTwoFactor: boolean;
  allowedOrigins?: string[];
  createdAt: Date;
  updatedAt: Date;
};

const PasswordPolicySchema = new Schema<PasswordPolicy>(
  {
    minLength: { type: Number, default: 8 },
    requireUpper: { type: Boolean, default: true },
    requireLower: { type: Boolean, default: true },
    requireNumber: { type: Boolean, default: true },
    requireSpecial: { type: Boolean, default: false },
  },
  { _id: false },
);

const SecurityPolicySchema = new Schema<SecurityPolicyDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    password: { type: PasswordPolicySchema, required: true },
    sessionTtlDays: { type: Number, default: 30 },
    requireTwoFactor: { type: Boolean, default: false },
    allowedOrigins: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const SecurityPolicy = mongoose.model<SecurityPolicyDocument>(
  "SecurityPolicy",
  SecurityPolicySchema,
);
