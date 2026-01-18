import mongoose, { Schema } from "mongoose";

type CampaignDocument = {
  orgId: mongoose.Types.ObjectId;
  name: string;
  channel: string;
  budget?: number;
  startAt?: Date;
  endAt?: Date;
  status: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

const CampaignSchema = new Schema<CampaignDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    channel: { type: String, required: true },
    budget: { type: Number },
    startAt: { type: Date },
    endAt: { type: Date },
    status: { type: String, required: true },
    utm: {
      source: { type: String },
      medium: { type: String },
      campaign: { type: String },
      term: { type: String },
      content: { type: String },
    },
  },
  { timestamps: true },
);

export const Campaign = mongoose.model<CampaignDocument>("Campaign", CampaignSchema);
