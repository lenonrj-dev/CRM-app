import mongoose, { Schema } from "mongoose";

type WorkflowDocument = {
  orgId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: Record<string, unknown>;
  conditions: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  createdBy: mongoose.Types.ObjectId;
  updatedAt?: Date;
  createdAt: Date;
};

const WorkflowSchema = new Schema<WorkflowDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: false },
    trigger: { type: Schema.Types.Mixed, required: true },
    conditions: { type: [Schema.Types.Mixed], default: [] },
    actions: { type: [Schema.Types.Mixed], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Workflow = mongoose.model<WorkflowDocument>("Workflow", WorkflowSchema);
