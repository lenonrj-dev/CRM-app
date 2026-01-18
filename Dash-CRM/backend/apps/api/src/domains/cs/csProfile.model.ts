import mongoose, { Schema } from "mongoose";

type OnboardingItem = {
  title: string;
  status: string;
  dueDate?: Date;
};

type CustomerSuccessProfileDocument = {
  orgId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  lifecycleStage: string;
  healthScore: number;
  healthBreakdown: Array<{ label: string; score: number; notes?: string }>;
  ownerId?: mongoose.Types.ObjectId;
  onboardingChecklist: OnboardingItem[];
  createdAt: Date;
  updatedAt: Date;
};

const OnboardingItemSchema = new Schema<OnboardingItem>(
  {
    title: { type: String, required: true },
    status: { type: String, required: true },
    dueDate: { type: Date },
  },
  { _id: true },
);

const CustomerSuccessProfileSchema = new Schema<CustomerSuccessProfileDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    lifecycleStage: { type: String, required: true },
    healthScore: { type: Number, required: true },
    healthBreakdown: { type: [Schema.Types.Mixed], default: [] },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    onboardingChecklist: { type: [OnboardingItemSchema], default: [] },
  },
  { timestamps: true },
);

export const CustomerSuccessProfile = mongoose.model<CustomerSuccessProfileDocument>(
  "CustomerSuccessProfile",
  CustomerSuccessProfileSchema,
);
