import mongoose from "mongoose";
import Wallet, { IWallet } from "@/models/Wallet";
import Transaction from "@/models/Transaction";
import { connectDB } from "@/lib/db";

/**
 * Get or create wallet for an employee
 */
export async function getOrCreateWallet(
  employeeId: mongoose.Types.ObjectId | string
): Promise<IWallet> {
  await connectDB();
  let wallet = await Wallet.findOne({ employee: employeeId });
  if (!wallet) {
    wallet = await Wallet.create({ employee: employeeId });
  }
  return wallet;
}

/**
 * Credit locked incentive to wallet
 */
export async function creditLockedIncentive(
  employeeId: mongoose.Types.ObjectId | string,
  amount: number,
  incentiveId: mongoose.Types.ObjectId,
  description: string
): Promise<IWallet> {
  await connectDB();
  const wallet = await getOrCreateWallet(employeeId);
  wallet.earned_total += amount;
  wallet.locked_amount += amount;
  await wallet.save();

  await Transaction.create({
    employee: employeeId,
    type: "incentive_earned",
    amount,
    balance_after: wallet.claimable_amount,
    reference_id: incentiveId,
    reference_model: "Incentive",
    description,
  });

  return wallet;
}

/**
 * Move amount from locked → claimable (after vesting)
 */
export async function vestIncentive(
  employeeId: mongoose.Types.ObjectId | string,
  amount: number,
  incentiveId: mongoose.Types.ObjectId
): Promise<IWallet> {
  await connectDB();
  const wallet = await getOrCreateWallet(employeeId);
  wallet.locked_amount = Math.max(0, wallet.locked_amount - amount);
  wallet.claimable_amount += amount;
  await wallet.save();

  await Transaction.create({
    employee: employeeId,
    type: "incentive_vested",
    amount,
    balance_after: wallet.claimable_amount,
    reference_id: incentiveId,
    reference_model: "Incentive",
    description: `Incentive vested — ₹${amount.toLocaleString("en-IN")} now claimable`,
  });

  return wallet;
}

/**
 * Move amount from claimable → held (user chose to hold for bonus)
 */
export async function holdIncentive(
  employeeId: mongoose.Types.ObjectId | string,
  amount: number,
  incentiveId: mongoose.Types.ObjectId,
  holdMonths: number
): Promise<IWallet> {
  await connectDB();
  const wallet = await getOrCreateWallet(employeeId);
  wallet.claimable_amount = Math.max(0, wallet.claimable_amount - amount);
  wallet.held_amount += amount;
  await wallet.save();

  await Transaction.create({
    employee: employeeId,
    type: "incentive_held",
    amount,
    balance_after: wallet.claimable_amount,
    reference_id: incentiveId,
    reference_model: "Incentive",
    description: `₹${amount.toLocaleString("en-IN")} held for ${holdMonths} month(s) to earn bonus`,
    meta: { holdMonths },
  });

  return wallet;
}

/**
 * Process a payout: deduct from claimable (or held), credit claimed_amount
 * Also applies hold bonus if applicable
 */
export async function processPayout(
  employeeId: mongoose.Types.ObjectId | string,
  baseAmount: number,
  finalAmount: number,  // base + bonus
  incentiveId: mongoose.Types.ObjectId,
  fromHeld: boolean
): Promise<IWallet> {
  await connectDB();
  const wallet = await getOrCreateWallet(employeeId);

  if (fromHeld) {
    wallet.held_amount = Math.max(0, wallet.held_amount - baseAmount);
  } else {
    wallet.claimable_amount = Math.max(0, wallet.claimable_amount - baseAmount);
  }

  wallet.claimed_amount += finalAmount;
  await wallet.save();

  if (finalAmount > baseAmount) {
    await Transaction.create({
      employee: employeeId,
      type: "hold_bonus_applied",
      amount: finalAmount - baseAmount,
      balance_after: wallet.claimable_amount,
      reference_id: incentiveId,
      reference_model: "Incentive",
      description: `Hold bonus applied: +₹${(finalAmount - baseAmount).toLocaleString("en-IN")}`,
    });
  }

  await Transaction.create({
    employee: employeeId,
    type: "incentive_claimed",
    amount: finalAmount,
    balance_after: wallet.claimable_amount,
    reference_id: incentiveId,
    reference_model: "Incentive",
    description: `Payout processed — ₹${finalAmount.toLocaleString("en-IN")}`,
    meta: { baseAmount, finalAmount, fromHeld },
  });

  return wallet;
}

/**
 * Get wallet summary for an employee
 */
export async function getWalletSummary(employeeId: string) {
  await connectDB();
  const wallet = await getOrCreateWallet(employeeId);
  const transactions = await Transaction.find({ employee: employeeId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return { wallet, transactions };
}
