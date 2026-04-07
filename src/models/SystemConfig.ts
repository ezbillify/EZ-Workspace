import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemConfig extends Document {
  company_revenue: number;
  profit_percentage: number;
  expense_percentage: number;
  company_stage: string;
  equity_min_percentage: number;
  equity_max_percentage: number;
  revenue_achievement_percentage: number;
  collections_percentage: number;
  delivery_health_percentage: number;
  vesting_days: number;
  bonus_percentage_1m: number;   // Hold 1 month bonus %
  bonus_percentage_2m: number;   // Hold 2 months bonus % (max cap)
  claim_limit: number;           // Max users per claim cycle
  payout_pool_amount: number;    // Total available payout pool (INR)
  payout_capacity: "HIGH" | "MODERATE" | "LOW";
  current_claim_cycle: number;   // Cycle counter (increments monthly)
  cycle_reset_date: Date;        // When the next cycle resets
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    company_revenue: { type: Number, required: true, default: 100000 },
    profit_percentage: { type: Number, required: true, default: 30, min: 0, max: 100 },
    expense_percentage: { type: Number, required: true, default: 70, min: 0, max: 100 },
    company_stage: { type: String, required: true, default: "Very early-stage startup" },
    equity_min_percentage: { type: Number, required: true, default: 2.5, min: 0, max: 100 },
    equity_max_percentage: { type: Number, required: true, default: 10, min: 0, max: 100 },
    revenue_achievement_percentage: { type: Number, required: true, default: 84, min: 0, max: 120 },
    collections_percentage: { type: Number, required: true, default: 87, min: 0, max: 120 },
    delivery_health_percentage: { type: Number, required: true, default: 75, min: 0, max: 120 },
    vesting_days: { type: Number, required: true, default: 30 },
    bonus_percentage_1m: { type: Number, required: true, default: 5 },
    bonus_percentage_2m: { type: Number, required: true, default: 10 },
    claim_limit: { type: Number, required: true, default: 25 },
    payout_pool_amount: { type: Number, required: true, default: 500000 },
    payout_capacity: {
      type: String,
      enum: ["HIGH", "MODERATE", "LOW"],
      default: "HIGH",
    },
    current_claim_cycle: { type: Number, default: 1 },
    cycle_reset_date: { type: Date, default: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }},
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SystemConfigSchema.pre("validate", function (next) {
  if (this.profit_percentage + this.expense_percentage !== 100) {
    this.invalidate("expense_percentage", "Profit and expense percentages must total 100");
  }
  if (this.equity_min_percentage > this.equity_max_percentage) {
    this.invalidate("equity_max_percentage", "Equity maximum must be greater than or equal to equity minimum");
  }
  next();
});

const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig ??
  mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);

export default SystemConfig;
