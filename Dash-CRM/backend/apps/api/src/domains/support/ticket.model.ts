import mongoose, { Schema } from "mongoose";
import type { TicketPriority, TicketStatus } from "@ateliux/shared";

type TicketComment = {
  authorId: mongoose.Types.ObjectId;
  body: string;
  isInternal: boolean;
  createdAt: Date;
};

type TicketDocument = {
  orgId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  visibilityScope?: string;
  comments: TicketComment[];
  createdAt: Date;
  updatedAt: Date;
};

const TicketCommentSchema = new Schema<TicketComment>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const TicketSchema = new Schema<TicketDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: { type: String, required: true },
    priority: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    visibilityScope: { type: String, default: "ORG" },
    comments: { type: [TicketCommentSchema], default: [] },
  },
  { timestamps: true },
);

TicketSchema.index({ orgId: 1, status: 1 });
TicketSchema.index({ title: "text", description: "text" });

export const Ticket = mongoose.model<TicketDocument>("Ticket", TicketSchema);
