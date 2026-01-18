import mongoose, { Schema } from "mongoose";

type TeamDocument = {
  orgId: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
};

const TeamSchema = new Schema<TeamDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    name: { type: String, required: true, trim: true },
    color: { type: String },
  },
  { timestamps: true },
);

TeamSchema.index({ orgId: 1, name: 1 }, { unique: true });

export const Team = mongoose.model<TeamDocument>("Team", TeamSchema);
