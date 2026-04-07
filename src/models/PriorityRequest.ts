import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/Incentive";
import "@/models/User";

export type PriorityRequestStatus = "pending" | "approved" | "rejected" | "paid";

export interface IPriorityRequest extends Document {
  employee: mongoose.Types.ObjectId;
  incentive: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  status: PriorityRequestStatus;
  reject_reason?: string;
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  paid_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PriorityRequestSchema = new Schema<IPriorityRequest>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    incentive: { type: Schema.Types.ObjectId, ref: "Incentive", required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    reject_reason: { type: String },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
    paid_at: { type: Date },
  },
  { timestamps: true }
);

PriorityRequestSchema.index({ employee: 1, status: 1 });

const PriorityRequest: Model<IPriorityRequest> =
  mongoose.models.PriorityRequest ??
  mongoose.model<IPriorityRequest>("PriorityRequest", PriorityRequestSchema);

export default PriorityRequest;
