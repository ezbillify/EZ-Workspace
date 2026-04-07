import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/User";

export type IncentiveStatus = "locked" | "claimable" | "held" | "claimed" | "cancelled";

export interface IIncentive extends Document {
  employee: mongoose.Types.ObjectId;
  fixed_amount: number;
  variable_amount: number;
  employee_score?: number;
  employee_multiplier: number;
  company_score: number;
  company_multiplier: number;
  amount: number;
  base_amount: number;          // Original amount before hold bonus
  status: IncentiveStatus;
  month: number;
  year: number;
  vesting_start: Date;
  vesting_end: Date;            // vesting_start + vesting_days
  held_since?: Date;            // When user chose to hold
  hold_months: number;          // 0 = immediate, 1 = 1 month hold, 2 = 2 months hold
  bonus_applied: number;        // Actual bonus % applied at payout
  claim_cycle?: number;         // Which cycle this was claimed in
  claimed_at?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncentiveSchema = new Schema<IIncentive>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fixed_amount: { type: Number, required: true, default: 0, min: 0 },
    variable_amount: { type: Number, required: true, default: 0, min: 0 },
    employee_score: { type: Number },
    employee_multiplier: { type: Number, required: true, default: 1 },
    company_score: { type: Number, required: true, default: 100 },
    company_multiplier: { type: Number, required: true, default: 1 },
    amount: { type: Number, required: true },
    base_amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["locked", "claimable", "held", "claimed", "cancelled"],
      default: "locked",
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    vesting_start: { type: Date, required: true, default: Date.now },
    vesting_end: { type: Date, required: true },
    held_since: { type: Date },
    hold_months: { type: Number, default: 0, min: 0, max: 2 },
    bonus_applied: { type: Number, default: 0 },
    claim_cycle: { type: Number },
    claimed_at: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

IncentiveSchema.index({ employee: 1, status: 1 });
IncentiveSchema.index({ employee: 1, month: 1, year: 1 });

const Incentive: Model<IIncentive> =
  mongoose.models.Incentive ?? mongoose.model<IIncentive>("Incentive", IncentiveSchema);

export default Incentive;
