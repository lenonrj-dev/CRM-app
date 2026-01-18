import mongoose, { Schema } from "mongoose";
import type { Role } from "@ateliux/shared";

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  orgId: mongoose.Types.ObjectId;
  emailVerified?: boolean;
  lastLoginAt?: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorVerifiedAt?: Date;
  twoFactorBackupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    twoFactorVerifiedAt: { type: Date },
    twoFactorBackupCodes: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const User = mongoose.model<UserDocument>("User", UserSchema);
