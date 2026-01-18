import mongoose, { Schema } from "mongoose";
import type { ActivityType } from "@ateliux/shared";

type ActivityDocument = {
  orgId: mongoose.Types.ObjectId;
  type: ActivityType;
  subject: string;
  dueDate?: Date;
  completed: boolean;
  notes?: string;
  contactId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  dealId?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  visibilityScope?: string;
  createdAt: Date;
  updatedAt: Date;
};

const ActivitySchema = new Schema<ActivityDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    type: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    notes: { type: String },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    dealId: { type: Schema.Types.ObjectId, ref: "Deal" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    visibilityScope: { type: String, default: "ORG" },
  },
  { timestamps: true },
);

ActivitySchema.index({ orgId: 1, createdAt: -1 });

export const Activity = mongoose.model<ActivityDocument>("Activity", ActivitySchema);
