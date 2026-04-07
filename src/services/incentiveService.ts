import mongoose from "mongoose";
import Incentive, { IIncentive } from "@/models/Incentive";
import SystemConfig from "@/models/SystemConfig";
import KpiScore from "@/models/KpiScore";
import { connectDB } from "@/lib/db";
import { addDays } from "@/lib/utils";
import { calculateCompanyScore, calculateFinalIncentive, getCompanyMultiplier, getEmployeeMultiplier } from "@/lib/incentiveMath";
import { creditLockedIncentive, vestIncentive } from "./walletService";

/**
 * Award a new incentive to an employee.
 * Immediately places it in "locked" state for vesting.
 */
export async function awardIncentive(
  employeeId: mongoose.Types.ObjectId | string,
  fixedAmount: number,
  variableAmount: number,
  month: number,
  year: number,
  notes?: string
): Promise<IIncentive> {
  await connectDB();
  const config = await SystemConfig.findOne().sort({ createdAt: -1 });
  const vestingDays = config?.vesting_days ?? 30;
  const latestKpi = await KpiScore.findOne({ employee: employeeId }).sort({ year: -1, month: -1 });
  const employeeScore = latestKpi?.final_score ?? null;
  const employeeMultiplier = getEmployeeMultiplier(employeeScore);
  const companyScore = calculateCompanyScore(
    config?.revenue_achievement_percentage ?? 84,
    config?.collections_percentage ?? 87,
    config?.delivery_health_percentage ?? 75
  );
  const companyMultiplier = getCompanyMultiplier(companyScore);

  const vestingStart = new Date();
  const vestingEnd = addDays(vestingStart, vestingDays);
  const totalAmount = calculateFinalIncentive(
    fixedAmount,
    variableAmount,
    employeeMultiplier,
    companyMultiplier
  );

  const incentive = await Incentive.create({
    employee: employeeId,
    fixed_amount: fixedAmount,
    variable_amount: variableAmount,
    employee_score: employeeScore ?? undefined,
    employee_multiplier: employeeMultiplier,
    company_score: companyScore,
    company_multiplier: companyMultiplier,
    amount: totalAmount,
    base_amount: totalAmount,
    status: "locked",
    month,
    year,
    vesting_start: vestingStart,
    vesting_end: vestingEnd,
    hold_months: 0,
    bonus_applied: 0,
    notes,
  });

  await creditLockedIncentive(
    employeeId,
    totalAmount,
    incentive._id as mongoose.Types.ObjectId,
    `Incentive awarded for ${month}/${year}`
  );

  return incentive;
}

/**
 * Process vesting: check all locked incentives whose vesting_end has passed
 * and move them to claimable. Called by a cron or manually.
 */
export async function processVesting(): Promise<number> {
  await connectDB();
  const now = new Date();

  const readyToVest = await Incentive.find({
    status: "locked",
    vesting_end: { $lte: now },
  });

  let count = 0;
  for (const incentive of readyToVest) {
    incentive.status = "claimable";
    await incentive.save();

    await vestIncentive(
      incentive.employee as mongoose.Types.ObjectId,
      incentive.amount,
      incentive._id as mongoose.Types.ObjectId
    );
    count++;
  }

  return count;
}

/**
 * Calculate projected payout with hold bonus.
 * Returns both 1-month and 2-month hold values.
 */
export async function calculateHoldProjection(baseAmount: number): Promise<{
  immediate: number;
  hold_1m: number;
  hold_2m: number;
}> {
  await connectDB();
  const config = await SystemConfig.findOne().sort({ createdAt: -1 });
  const b1 = config?.bonus_percentage_1m ?? 5;
  const b2 = config?.bonus_percentage_2m ?? 10;

  return {
    immediate: baseAmount,
    hold_1m: parseFloat((baseAmount * (1 + b1 / 100)).toFixed(2)),
    hold_2m: parseFloat((baseAmount * (1 + b2 / 100)).toFixed(2)),
  };
}

/**
 * User opts to hold their claimable incentive for bonus.
 * Transitions: claimable → held
 */
export async function holdForBonus(
  incentiveId: string,
  employeeId: string,
  holdMonths: 1 | 2
): Promise<IIncentive> {
  await connectDB();
  const config = await SystemConfig.findOne().sort({ createdAt: -1 });
  const bonusPct =
    holdMonths === 1
      ? (config?.bonus_percentage_1m ?? 5)
      : (config?.bonus_percentage_2m ?? 10);

  const incentive = await Incentive.findOne({
    _id: incentiveId,
    employee: employeeId,
    status: "claimable",
  });

  if (!incentive) throw new Error("Incentive not found or not claimable");

  const newAmount = parseFloat(
    (incentive.base_amount * (1 + bonusPct / 100)).toFixed(2)
  );

  incentive.status = "held";
  incentive.held_since = new Date();
  incentive.hold_months = holdMonths;
  incentive.amount = newAmount;
  incentive.bonus_applied = bonusPct;
  await incentive.save();

  const { holdIncentive } = await import("./walletService");
  await holdIncentive(
    employeeId,
    incentive.base_amount,
    incentive._id as mongoose.Types.ObjectId,
    holdMonths
  );

  return incentive;
}

/**
 * Get incentive summary for a user (wallet breakdown + list)
 */
export async function getIncentiveSummary(employeeId: string) {
  await connectDB();
  const incentives = await Incentive.find({ employee: employeeId })
    .sort({ createdAt: -1 })
    .lean();

  const normalizedIncentives = incentives.map((incentive) => ({
    ...incentive,
    fixed_amount: incentive.fixed_amount ?? incentive.base_amount,
    variable_amount: incentive.variable_amount ?? 0,
    employee_multiplier: incentive.employee_multiplier ?? 1,
    company_score: incentive.company_score ?? 100,
    company_multiplier: incentive.company_multiplier ?? 1,
  }));

  const locked = normalizedIncentives.filter((i) => i.status === "locked");
  const claimable = normalizedIncentives.filter((i) => i.status === "claimable");
  const held = normalizedIncentives.filter((i) => i.status === "held");
  const claimed = normalizedIncentives.filter((i) => i.status === "claimed");

  const sum = (arr: typeof normalizedIncentives) =>
    arr.reduce((acc, i) => acc + i.amount, 0);

  return {
    incentives: normalizedIncentives,
    summary: {
      total_earned: normalizedIncentives.reduce((acc, i) => acc + i.base_amount, 0),
      locked: sum(locked),
      claimable: sum(claimable),
      held: sum(held),
      claimed: sum(claimed),
    },
  };
}
