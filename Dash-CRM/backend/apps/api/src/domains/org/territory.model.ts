import mongoose, { Schema } from "mongoose";

type TerritoryRule = {
  regions?: string[];
  industries?: string[];
  sizes?: string[];
};

type TerritoryDocument = {
  orgId: mongoose.Types.ObjectId;
  name: string;
  unitId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  rules: TerritoryRule;
  createdAt: Date;
  updatedAt: Date;
};

const TerritoryRuleSchema = new Schema<TerritoryRule>(
  {
    regions: { type: [String], default: [] },
    industries: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
  },
  { _id: false },
);

const TerritorySchema = new Schema<TerritoryDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    rules: { type: TerritoryRuleSchema, default: () => ({}) },
  },
  { timestamps: true },
);

TerritorySchema.index({ orgId: 1, name: 1 }, { unique: true });

export const Territory = mongoose.model<TerritoryDocument>("Territory", TerritorySchema);
