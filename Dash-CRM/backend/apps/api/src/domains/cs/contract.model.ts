import mongoose, { Schema } from "mongoose";

type ContractDocument = {
  orgId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  startAt: Date;
  endAt: Date;
  value: number;
  status: string;
  renewalStatus: string;
  ownerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const ContractSchema = new Schema<ContractDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    value: { type: Number, required: true },
    status: { type: String, required: true },
    renewalStatus: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Contract = mongoose.model<ContractDocument>("Contract", ContractSchema);
