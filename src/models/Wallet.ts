import mongoose, { Schema, Document, Model } from "mongoose";
import "@/models/User";

export interface IWallet extends Document {
  employee: mongoose.Types.ObjectId;
  earned_total: number;     // All-time total earned
  locked_amount: number;    // Under vesting (not yet claimable)
  claimable_amount: number; // Vested, ready to claim
  held_amount: number;      // User chose to hold for bonus
  claimed_amount: number;   // Already paid out
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    earned_total: { type: Number, default: 0 },
    locked_amount: { type: Number, default: 0 },
    claimable_amount: { type: Number, default: 0 },
    held_amount: { type: Number, default: 0 },
    claimed_amount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Wallet: Model<IWallet> =
  mongoose.models.Wallet ?? mongoose.model<IWallet>("Wallet", WalletSchema);

export default Wallet;
