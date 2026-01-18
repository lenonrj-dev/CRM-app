import mongoose, { Schema } from "mongoose";

type CatalogItemDocument = {
  orgId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  unitPrice: number;
  currency: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const CatalogItemSchema = new Schema<CatalogItemDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    description: { type: String },
    unitPrice: { type: Number, required: true },
    currency: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CatalogItem = mongoose.model<CatalogItemDocument>("CatalogItem", CatalogItemSchema);
