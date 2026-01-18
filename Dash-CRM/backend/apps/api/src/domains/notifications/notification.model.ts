import mongoose, { Schema } from "mongoose";

type NotificationDocument = {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  entity?: string;
  entityId?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const NotificationSchema = new Schema<NotificationDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entity: { type: String },
    entityId: { type: String },
    readAt: { type: Date },
  },
  { timestamps: true },
);

export const Notification = mongoose.model<NotificationDocument>("Notification", NotificationSchema);
