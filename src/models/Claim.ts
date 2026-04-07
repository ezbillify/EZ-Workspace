import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/Incentive";
import "@/models/User";

export type ClaimStatus = "pending" | "queued" | "approved" | "paid" | "rejected";

export interface IClaim extends Document {
  employee: mongoose.Types.ObjectId;
  incentive: mongoose.Types.ObjectId;
  amount: number;                 // Final amount (with hold bonus if any)
  status: ClaimStatus;
  cycle: number;                  // Claim cycle number
  queue_position?: number;        // Position in cycle queue
  requested_at: Date;
  processed_at?: Date;
  reject_reason?: string;
  processed_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    incentive: { type: Schema.Types.ObjectId, ref: "Incentive", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "queued", "approved", "paid", "rejected"],
      default: "pending",
    },
    cycle: { type: Number, required: true },
    queue_position: { type: Number },
    requested_at: { type: Date, default: Date.now },
    processed_at: { type: Date },
    reject_reason: { type: String },
    processed_by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ClaimSchema.index({ employee: 1, cycle: 1 });
ClaimSchema.index({ status: 1, cycle: 1 });

const Claim: Model<IClaim> =
  mongoose.models.Claim ?? mongoose.model<IClaim>("Claim", ClaimSchema);

export default Claim;
