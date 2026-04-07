import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/User";

export type ReimbursementStatus = "pending" | "approved" | "rejected" | "paid";
export type ReimbursementCategory =
  | "travel"
  | "food"
  | "accommodation"
  | "equipment"
  | "medical"
  | "training"
  | "other";

export interface IReimbursement extends Document {
  employee: mongoose.Types.ObjectId;
  title: string;
  category: ReimbursementCategory;
  amount: number;
  description: string;
  bill_urls: string[];            // Uploaded bill file paths
  status: ReimbursementStatus;
  reject_reason?: string;
  approved_by?: mongoose.Types.ObjectId;
  approved_at?: Date;
  paid_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReimbursementSchema = new Schema<IReimbursement>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["travel", "food", "accommodation", "equipment", "medical", "training", "other"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    bill_urls: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    reject_reason: { type: String },
    approved_by: { type: Schema.Types.ObjectId, ref: "User" },
    approved_at: { type: Date },
    paid_at: { type: Date },
  },
  { timestamps: true }
);

ReimbursementSchema.index({ employee: 1, status: 1 });

const Reimbursement: Model<IReimbursement> =
  mongoose.models.Reimbursement ??
  mongoose.model<IReimbursement>("Reimbursement", ReimbursementSchema);

export default Reimbursement;
