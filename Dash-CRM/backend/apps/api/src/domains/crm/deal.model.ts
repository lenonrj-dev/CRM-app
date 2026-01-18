import mongoose, { Schema } from "mongoose";
import type { DealStage } from "@ateliux/shared";
import { AttributionSchema, LeadScoreSchema } from "../marketing/marketing.schemas";

type DealDocument = {
  orgId: mongoose.Types.ObjectId;
  name: string;
  stage: DealStage;
  value: number;
  expectedCloseDate?: Date;
  ownerId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  visibilityScope?: string;
  lostReason?: string;
  createdFrom?: string;
  attribution?: {
    firstTouch?: Record<string, unknown>;
    lastTouch?: Record<string, unknown>;
  };
  leadScore?: {
    scoreTotal: number;
    fitScore: number;
    intentScore: number;
    breakdown: Array<{ label: string; score: number; notes?: string }>;
    updatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
};

const DealSchema = new Schema<DealDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    stage: { type: String, required: true },
    value: { type: Number, required: true },
    expectedCloseDate: { type: Date },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    visibilityScope: { type: String, default: "ORG" },
    lostReason: { type: String },
    createdFrom: { type: String },
    attribution: { type: AttributionSchema },
    leadScore: { type: LeadScoreSchema },
  },
  { timestamps: true },
);

DealSchema.index({ orgId: 1, stage: 1 });
DealSchema.index({ name: "text", lostReason: "text" });

export const Deal = mongoose.model<DealDocument>("Deal", DealSchema);
