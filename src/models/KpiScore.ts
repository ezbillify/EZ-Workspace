import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/User";

export interface IKpiScore extends Document {
  employee: mongoose.Types.ObjectId;
  month: number;       // 1-12
  year: number;
  kra_score: number;   // 0-100
  kpi_score: number;   // 0-100
  behavioral_score?: number; // 0-100
  final_score: number; // Weighted average (calculated)
  kpi_entries?: Array<{
    label: string;
    weight: number;
    score: number;
  }>;
  kra_metrics?: {
    ownership: number;
    quality: number;
    initiative: number;
  };
  behavioral_metrics?: {
    attendance: number;
    discipline: number;
    communication: number;
  };
  rating_label?: string;
  incentive_hint?: string;
  remarks?: string;
  enteredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KpiScoreSchema = new Schema<IKpiScore>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    kra_score: { type: Number, required: true, min: 0, max: 100 },
    kpi_score: { type: Number, required: true, min: 0, max: 100 },
    behavioral_score: { type: Number, min: 0, max: 100, default: 0 },
    final_score: { type: Number, required: true, min: 0, max: 100 },
    kpi_entries: [
      {
        label: { type: String, required: true },
        weight: { type: Number, required: true, min: 0, max: 100 },
        score: { type: Number, required: true, min: 0, max: 100 },
      },
    ],
    kra_metrics: {
      ownership: { type: Number, min: 0, max: 5, default: 0 },
      quality: { type: Number, min: 0, max: 5, default: 0 },
      initiative: { type: Number, min: 0, max: 5, default: 0 },
    },
    behavioral_metrics: {
      attendance: { type: Number, min: 0, max: 100, default: 0 },
      discipline: { type: Number, min: 0, max: 5, default: 0 },
      communication: { type: Number, min: 0, max: 5, default: 0 },
    },
    rating_label: { type: String },
    incentive_hint: { type: String },
    remarks: { type: String },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Unique constraint: one score entry per employee per month/year
KpiScoreSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const KpiScore: Model<IKpiScore> =
  mongoose.models.KpiScore ?? mongoose.model<IKpiScore>("KpiScore", KpiScoreSchema);

export default KpiScore;
