import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/User";

export type TransactionType =
  | "incentive_earned"
  | "incentive_vested"
  | "incentive_held"
  | "incentive_claimed"
  | "hold_bonus_applied"
  | "reimbursement_paid"
  | "priority_payout";

export interface ITransaction extends Document {
  employee: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balance_after: number;          // Wallet claimable after this tx
  reference_id?: mongoose.Types.ObjectId; // Incentive / Reimbursement ID
  reference_model?: string;
  description: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "incentive_earned",
        "incentive_vested",
        "incentive_held",
        "incentive_claimed",
        "hold_bonus_applied",
        "reimbursement_paid",
        "priority_payout",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    balance_after: { type: Number, required: true },
    reference_id: { type: Schema.Types.ObjectId },
    reference_model: { type: String },
    description: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

TransactionSchema.index({ employee: 1, createdAt: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
