import mongoose, { Schema } from "mongoose";

type ProposalItem = {
  catalogItemId?: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
};

type ProposalDocument = {
  orgId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  dealId?: mongoose.Types.ObjectId;
  status: string;
  items: ProposalItem[];
  discountType: string;
  discountValue: number;
  subtotal: number;
  total: number;
  validUntil?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const ProposalItemSchema = new Schema<ProposalItem>(
  {
    catalogItemId: { type: Schema.Types.ObjectId, ref: "CatalogItem" },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: true },
);

const ProposalSchema = new Schema<ProposalDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    dealId: { type: Schema.Types.ObjectId, ref: "Deal" },
    status: { type: String, required: true },
    items: { type: [ProposalItemSchema], default: [] },
    discountType: { type: String, required: true },
    discountValue: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    validUntil: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

export const Proposal = mongoose.model<ProposalDocument>("Proposal", ProposalSchema);
