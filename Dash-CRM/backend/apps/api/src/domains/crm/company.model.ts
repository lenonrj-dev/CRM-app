import mongoose, { Schema } from "mongoose";
import { AttributionSchema } from "../marketing/marketing.schemas";

type CompanyDocument = {
  orgId: mongoose.Types.ObjectId;
  name: string;
  industry?: string;
  website?: string;
  size?: string;
  region?: string;
  ownerId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  visibilityScope?: string;
  tags?: string[];
  createdFrom?: string;
  attribution?: {
    firstTouch?: Record<string, unknown>;
    lastTouch?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
};

const CompanySchema = new Schema<CompanyDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    industry: { type: String },
    website: { type: String },
    size: { type: String },
    region: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    visibilityScope: { type: String, default: "ORG" },
    tags: [{ type: String }],
    createdFrom: { type: String },
    attribution: { type: AttributionSchema },
  },
  { timestamps: true },
);

CompanySchema.index({ orgId: 1, createdAt: -1 });
CompanySchema.index({ name: "text", industry: "text", region: "text" });

export const Company = mongoose.model<CompanyDocument>("Company", CompanySchema);
