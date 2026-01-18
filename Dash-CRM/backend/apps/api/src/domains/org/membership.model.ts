import mongoose, { Schema } from "mongoose";
import type { Role, VisibilityScope, MembershipStatus } from "@ateliux/shared";

type MembershipDocument = {
  userId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  teamIds?: mongoose.Types.ObjectId[];
  role: Role;
  scope: VisibilityScope;
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
};

const MembershipSchema = new Schema<MembershipDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    unitId: { type: Schema.Types.ObjectId, ref: "Unit" },
    teamIds: { type: [Schema.Types.ObjectId], ref: "Team", default: [] },
    role: { type: String, required: true },
    scope: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true },
);

MembershipSchema.index({ orgId: 1, userId: 1 });

export const UserMembership = mongoose.model<MembershipDocument>(
  "UserMembership",
  MembershipSchema,
);
