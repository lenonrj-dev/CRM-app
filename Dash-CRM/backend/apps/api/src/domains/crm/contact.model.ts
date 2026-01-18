import mongoose, { Schema } from "mongoose";
import { AttributionSchema, LeadScoreSchema } from "../marketing/marketing.schemas";

type ContactDocument = {
  orgId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  visibilityScope?: string;
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

const ContactSchema = new Schema<ContactDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String },
    phone: { type: String },
    title: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    visibilityScope: { type: String, default: "ORG" },
    createdFrom: { type: String },
    attribution: { type: AttributionSchema },
    leadScore: { type: LeadScoreSchema },
  },
  { timestamps: true },
);

ContactSchema.index({ orgId: 1, createdAt: -1 });
ContactSchema.index({ firstName: "text", lastName: "text", email: "text" });

export const Contact = mongoose.model<ContactDocument>("Contact", ContactSchema);
