import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SystemConfig from "@/models/SystemConfig";
import { authenticate, requireRole } from "@/middleware/auth";
import { z } from "zod";

const DEFAULT_COMPANY_REVENUE = 100000;
const DEFAULT_PROFIT_PERCENTAGE = 30;
const DEFAULT_EXPENSE_PERCENTAGE = 70;
const DEFAULT_COMPANY_STAGE = "Very early-stage startup";
const DEFAULT_EQUITY_MIN_PERCENTAGE = 2.5;
const DEFAULT_EQUITY_MAX_PERCENTAGE = 10;
const DEFAULT_REVENUE_ACHIEVEMENT_PERCENTAGE = 84;
const DEFAULT_COLLECTIONS_PERCENTAGE = 87;
const DEFAULT_DELIVERY_HEALTH_PERCENTAGE = 75;

const ConfigSchema = z.object({
  company_revenue: z.number().min(0).optional(),
  profit_percentage: z.number().min(0).max(100).optional(),
  expense_percentage: z.number().min(0).max(100).optional(),
  company_stage: z.string().min(2).max(120).optional(),
  equity_min_percentage: z.number().min(0).max(100).optional(),
  equity_max_percentage: z.number().min(0).max(100).optional(),
  revenue_achievement_percentage: z.number().min(0).max(120).optional(),
  collections_percentage: z.number().min(0).max(120).optional(),
  delivery_health_percentage: z.number().min(0).max(120).optional(),
  vesting_days: z.number().min(1).max(365).optional(),
  bonus_percentage_1m: z.number().min(0).max(100).optional(),
  bonus_percentage_2m: z.number().min(0).max(100).optional(),
  claim_limit: z.number().min(1).max(1000).optional(),
  payout_pool_amount: z.number().min(0).optional(),
  payout_capacity: z.enum(["HIGH", "MODERATE", "LOW"]).optional(),
}).superRefine((data, ctx) => {
  const hasCompanySplit =
    data.profit_percentage !== undefined || data.expense_percentage !== undefined;

  if (
    hasCompanySplit &&
    data.profit_percentage !== undefined &&
    data.expense_percentage !== undefined &&
    data.profit_percentage + data.expense_percentage !== 100
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expense_percentage"],
      message: "Profit and expense percentages must total 100",
    });
  }

  if (
    data.equity_min_percentage !== undefined &&
    data.equity_max_percentage !== undefined &&
    data.equity_min_percentage > data.equity_max_percentage
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["equity_max_percentage"],
      message: "Equity maximum must be greater than or equal to equity minimum",
    });
  }
});

function normalizeConfig<T extends Record<string, unknown>>(config: T) {
  return {
    ...config,
    company_revenue: (config.company_revenue as number | undefined) ?? DEFAULT_COMPANY_REVENUE,
    profit_percentage: (config.profit_percentage as number | undefined) ?? DEFAULT_PROFIT_PERCENTAGE,
    expense_percentage: (config.expense_percentage as number | undefined) ?? DEFAULT_EXPENSE_PERCENTAGE,
    company_stage: (config.company_stage as string | undefined) ?? DEFAULT_COMPANY_STAGE,
    equity_min_percentage: (config.equity_min_percentage as number | undefined) ?? DEFAULT_EQUITY_MIN_PERCENTAGE,
    equity_max_percentage: (config.equity_max_percentage as number | undefined) ?? DEFAULT_EQUITY_MAX_PERCENTAGE,
    revenue_achievement_percentage: (config.revenue_achievement_percentage as number | undefined) ?? DEFAULT_REVENUE_ACHIEVEMENT_PERCENTAGE,
    collections_percentage: (config.collections_percentage as number | undefined) ?? DEFAULT_COLLECTIONS_PERCENTAGE,
    delivery_health_percentage: (config.delivery_health_percentage as number | undefined) ?? DEFAULT_DELIVERY_HEALTH_PERCENTAGE,
  };
}

// GET /api/config — any authenticated user (employees need payout_capacity)
export async function GET(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const config = await SystemConfig.findOne().sort({ createdAt: -1 }).lean();
    if (!config) return NextResponse.json({ error: "Config not found" }, { status: 404 });
    const normalizedConfig = normalizeConfig(config);

    // Employees only see safe fields
    if (authUser.role === "employee") {
      return NextResponse.json({
        company_revenue: normalizedConfig.company_revenue,
        profit_percentage: normalizedConfig.profit_percentage,
        expense_percentage: normalizedConfig.expense_percentage,
        company_stage: normalizedConfig.company_stage,
        equity_min_percentage: normalizedConfig.equity_min_percentage,
        equity_max_percentage: normalizedConfig.equity_max_percentage,
        revenue_achievement_percentage: normalizedConfig.revenue_achievement_percentage,
        collections_percentage: normalizedConfig.collections_percentage,
        delivery_health_percentage: normalizedConfig.delivery_health_percentage,
        payout_pool_amount: normalizedConfig.payout_pool_amount,
        payout_capacity: normalizedConfig.payout_capacity,
        vesting_days: normalizedConfig.vesting_days,
        bonus_percentage_1m: normalizedConfig.bonus_percentage_1m,
        bonus_percentage_2m: normalizedConfig.bonus_percentage_2m,
        current_claim_cycle: normalizedConfig.current_claim_cycle,
        cycle_reset_date: normalizedConfig.cycle_reset_date,
      });
    }

    return NextResponse.json({ config: normalizedConfig });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// PATCH /api/config — Super Admin only
export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await requireRole(req, "super_admin");
    await connectDB();

    const body = await req.json();
    const data = ConfigSchema.parse(body);

    if (data.profit_percentage !== undefined && data.expense_percentage === undefined) {
      data.expense_percentage = 100 - data.profit_percentage;
    }

    if (data.expense_percentage !== undefined && data.profit_percentage === undefined) {
      data.profit_percentage = 100 - data.expense_percentage;
    }

    let config = await SystemConfig.findOne().sort({ createdAt: -1 });
    if (!config) {
      config = await SystemConfig.create({ ...data, updatedBy: adminUser.userId });
    } else {
      Object.assign(config, data);
      config.updatedBy = adminUser.userId as unknown as typeof config.updatedBy;
      await config.save();
    }

    return NextResponse.json({ config });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
