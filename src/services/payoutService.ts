import mongoose from "mongoose";
import Claim from "@/models/Claim";
import Incentive from "@/models/Incentive";
import PriorityRequest from "@/models/PriorityRequest";
import SystemConfig from "@/models/SystemConfig";
import { connectDB } from "@/lib/db";
import { processPayout } from "./walletService";

/**
 * Submit a claim for a vested/held incentive.
 * Enforces: claim_limit per cycle, pool deduction.
 */
export async function submitClaim(
  employeeId: string,
  incentiveId: string
): Promise<{ claim: InstanceType<typeof Claim>; queued: boolean; position: number }> {
  await connectDB();
  const config = await SystemConfig.findOne().sort({ createdAt: -1 });
  if (!config) throw new Error("System config not found");

  const incentive = await Incentive.findOne({
    _id: incentiveId,
    employee: employeeId,
    status: { $in: ["claimable", "held"] },
  });
  if (!incentive) throw new Error("Incentive not claimable");

  // Count approved claims in current cycle
  const approvedCount = await Claim.countDocuments({
    cycle: config.current_claim_cycle,
    status: { $in: ["approved", "paid"] },
  });

  const withinLimit = approvedCount < config.claim_limit;
  const withinPool = config.payout_pool_amount >= incentive.amount;

  const status = withinLimit && withinPool ? "approved" : "queued";
  const position = withinLimit ? approvedCount + 1 : undefined;

  const claim = await Claim.create({
    employee: employeeId,
    incentive: incentiveId,
    amount: incentive.amount,
    status,
    cycle: config.current_claim_cycle,
    queue_position: position,
    requested_at: new Date(),
  });

  if (status === "approved") {
    // Deduct from pool
    config.payout_pool_amount = Math.max(0, config.payout_pool_amount - incentive.amount);
    await config.save();
  }

  return { claim, queued: status === "queued", position: position ?? 0 };
}

/**
 * Process approved claims: mark incentive as claimed, update wallet.
 */
export async function processClaim(
  claimId: string,
  adminId: string
): Promise<void> {
  await connectDB();
  const claim = await Claim.findById(claimId).populate("incentive");
  if (!claim || claim.status !== "approved") throw new Error("Claim not approved");

  const incentive = await Incentive.findById(claim.incentive);
  if (!incentive) throw new Error("Incentive not found");

  const fromHeld = incentive.status === "held";

  await processPayout(
    claim.employee as mongoose.Types.ObjectId,
    incentive.base_amount,
    incentive.amount,
    incentive._id as mongoose.Types.ObjectId,
    fromHeld
  );

  incentive.status = "claimed";
  incentive.claim_cycle = claim.cycle;
  incentive.claimed_at = new Date();
  await incentive.save();

  claim.status = "paid";
  claim.processed_at = new Date();
  claim.processed_by = new mongoose.Types.ObjectId(adminId);
  await claim.save();
}

/**
 * Advance to next claim cycle: queue overflow users get a new cycle slot.
 */
export async function advanceCycle(): Promise<void> {
  await connectDB();
  const config = await SystemConfig.findOne().sort({ createdAt: -1 });
  if (!config) throw new Error("Config not found");

  config.current_claim_cycle += 1;
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 1);
  next.setHours(0, 0, 0, 0);
  config.cycle_reset_date = next;
  await config.save();

  // Re-queue queued claims into the new cycle
  await Claim.updateMany(
    { status: "queued" },
    { $set: { cycle: config.current_claim_cycle } }
  );
}

/**
 * Submit a priority payout request (bypasses queue if approved).
 */
export async function submitPriorityRequest(
  employeeId: string,
  incentiveId: string,
  reason: string
): Promise<InstanceType<typeof PriorityRequest>> {
  await connectDB();
  const incentive = await Incentive.findOne({
    _id: incentiveId,
    employee: employeeId,
    status: { $in: ["claimable", "held"] },
  });
  if (!incentive) throw new Error("Incentive not available for priority request");

  const existing = await PriorityRequest.findOne({
    employee: employeeId,
    incentive: incentiveId,
    status: "pending",
  });
  if (existing) throw new Error("Priority request already pending");

  return PriorityRequest.create({
    employee: employeeId,
    incentive: incentiveId,
    amount: incentive.amount,
    reason,
  });
}

/**
 * Admin reviews a priority request.
 */
export async function reviewPriorityRequest(
  requestId: string,
  adminId: string,
  decision: "approved" | "rejected",
  rejectReason?: string
): Promise<void> {
  await connectDB();
  const req = await PriorityRequest.findById(requestId);
  if (!req || req.status !== "pending") throw new Error("Request not found or already reviewed");

  req.status = decision;
  req.reviewed_by = new mongoose.Types.ObjectId(adminId);
  req.reviewed_at = new Date();
  if (decision === "rejected") req.reject_reason = rejectReason;
  await req.save();

  if (decision === "approved") {
    const config = await SystemConfig.findOne().sort({ createdAt: -1 });
    const incentive = await Incentive.findById(req.incentive);
    if (!incentive) return;

    const fromHeld = incentive.status === "held";
    await processPayout(
      req.employee as mongoose.Types.ObjectId,
      incentive.base_amount,
      incentive.amount,
      incentive._id as mongoose.Types.ObjectId,
      fromHeld
    );

    incentive.status = "claimed";
    incentive.claimed_at = new Date();
    await incentive.save();

    req.paid_at = new Date();
    await req.save();

    if (config) {
      config.payout_pool_amount = Math.max(0, config.payout_pool_amount - incentive.amount);
      await config.save();
    }
  }
}
