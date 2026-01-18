import { Schema } from "mongoose";

export const UtmSchema = new Schema(
  {
    source: { type: String },
    medium: { type: String },
    campaign: { type: String },
    term: { type: String },
    content: { type: String },
  },
  { _id: false },
);

export const AttributionTouchSchema = new Schema(
  {
    utm: { type: UtmSchema },
    landingPage: { type: String },
    referrer: { type: String },
    createdFrom: { type: String },
    timestamp: { type: Date },
  },
  { _id: false },
);

export const AttributionSchema = new Schema(
  {
    firstTouch: { type: AttributionTouchSchema },
    lastTouch: { type: AttributionTouchSchema },
  },
  { _id: false },
);

export const ScoreBreakdownSchema = new Schema(
  {
    label: { type: String, required: true },
    score: { type: Number, required: true },
    notes: { type: String },
  },
  { _id: false },
);

export const LeadScoreSchema = new Schema(
  {
    scoreTotal: { type: Number, required: true },
    fitScore: { type: Number, required: true },
    intentScore: { type: Number, required: true },
    breakdown: { type: [ScoreBreakdownSchema], default: [] },
    updatedAt: { type: Date },
  },
  { _id: false },
);
