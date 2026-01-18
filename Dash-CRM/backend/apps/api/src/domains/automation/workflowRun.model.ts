import mongoose, { Schema } from "mongoose";

type WorkflowRunDocument = {
  orgId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  status: string;
  triggerEvent: string;
  result?: string;
  error?: string;
  executedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const WorkflowRunSchema = new Schema<WorkflowRunDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    status: { type: String, required: true },
    triggerEvent: { type: String, required: true },
    result: { type: String },
    error: { type: String },
    executedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const WorkflowRun = mongoose.model<WorkflowRunDocument>("WorkflowRun", WorkflowRunSchema);
