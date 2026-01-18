import mongoose, { Schema } from "mongoose";

type UnitDocument = {
  orgId: mongoose.Types.ObjectId;
  name: string;
  region?: string;
  createdAt: Date;
  updatedAt: Date;
};

const UnitSchema = new Schema<UnitDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    region: { type: String },
  },
  { timestamps: true },
);

UnitSchema.index({ orgId: 1, name: 1 }, { unique: true });

export const Unit = mongoose.model<UnitDocument>("Unit", UnitSchema);
