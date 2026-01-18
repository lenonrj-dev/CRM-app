import mongoose, { Schema } from "mongoose";

type OrganizationDocument = {
  name: string;
  slug: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  currency: string;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const OrganizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ["FREE", "PRO", "ENTERPRISE"], default: "FREE" },
    currency: { type: String, default: "BRL" },
    timezone: { type: String, default: "America/Sao_Paulo" },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Organization = mongoose.model("Organization", OrganizationSchema);
