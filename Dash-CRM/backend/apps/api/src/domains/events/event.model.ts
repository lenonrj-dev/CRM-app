import mongoose, { Schema } from "mongoose";

type EventDocument = {
  orgId: mongoose.Types.ObjectId;
  type: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  attempts: number;
  nextRunAt: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
};

const EventSchema = new Schema<EventDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, required: true, default: "PENDING" },
    attempts: { type: Number, default: 0 },
    nextRunAt: { type: Date, default: () => new Date() },
    lastError: { type: String },
  },
  { timestamps: true },
);

EventSchema.index({ status: 1, nextRunAt: 1 });

export const Event = mongoose.model<EventDocument>("Event", EventSchema);
