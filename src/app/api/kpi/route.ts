import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import KpiScore from "@/models/KpiScore";
import { authenticate, requireRole } from "@/middleware/auth";
import { z } from "zod";
import {
  calculateBehavioralScore,
  calculateFinalKpiScore,
  calculateKraScore,
  calculateWeightedKpi,
  getKpiRating,
} from "@/lib/kpiMath";

const KpiSchema = z.object({
  employee: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  kpi_entries: z.array(z.object({
    label: z.string(),
    weight: z.number().min(0).max(100),
    score: z.number().min(0).max(100),
  })).min(1).max(3).optional(),
  kra_metrics: z.object({
    ownership: z.number().min(0).max(5),
    quality: z.number().min(0).max(5),
    initiative: z.number().min(0).max(5),
  }).optional(),
  behavioral_metrics: z.object({
    attendance: z.number().min(0).max(100),
    discipline: z.number().min(0).max(5),
    communication: z.number().min(0).max(5),
  }).optional(),
  kra_score: z.number().min(0).max(100).optional(),
  kpi_score: z.number().min(0).max(100).optional(),
  behavioral_score: z.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
});

// GET /api/kpi?employeeId=xxx&year=2024
export async function GET(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const employeeId =
      authUser.role === "employee" ? authUser.userId : searchParams.get("employeeId");

    if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });

    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const filter: Record<string, unknown> = { employee: employeeId };
    if (year) filter.year = year;

    const scores = await KpiScore.find(filter)
      .sort({ year: -1, month: -1 })
      .populate("enteredBy", "name")
      .lean();

    return NextResponse.json({ scores });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/kpi — HR/Admin enter KPI scores
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireRole(req, "lead", "super_admin");
    await connectDB();

    const body = await req.json();
    const data = KpiSchema.parse(body);

    const normalizedKpiEntries = data.kpi_entries ?? [
      { label: "KPI 1", weight: 30, score: data.kpi_score ?? 0 },
      { label: "KPI 2", weight: 30, score: data.kpi_score ?? 0 },
      { label: "KPI 3", weight: 40, score: data.kpi_score ?? 0 },
    ];
    const normalizedKraMetrics = data.kra_metrics ?? {
      ownership: Math.round(((data.kra_score ?? 0) / 20)),
      quality: Math.round(((data.kra_score ?? 0) / 20)),
      initiative: Math.round(((data.kra_score ?? 0) / 20)),
    };
    const normalizedBehavioralMetrics = data.behavioral_metrics ?? {
      attendance: data.behavioral_score ?? 0,
      discipline: 0,
      communication: 0,
    };

    const kpi_score = calculateWeightedKpi(normalizedKpiEntries);
    const kra_score = calculateKraScore(normalizedKraMetrics);
    const behavioral_score = calculateBehavioralScore(normalizedBehavioralMetrics);
    const final_score = calculateFinalKpiScore(kpi_score, kra_score, behavioral_score);
    const rating = getKpiRating(final_score);

    const score = await KpiScore.findOneAndUpdate(
      { employee: data.employee, month: data.month, year: data.year },
      {
        employee: data.employee,
        month: data.month,
        year: data.year,
        kpi_entries: normalizedKpiEntries,
        kra_metrics: normalizedKraMetrics,
        behavioral_metrics: normalizedBehavioralMetrics,
        kpi_score,
        kra_score,
        behavioral_score,
        final_score,
        rating_label: rating.label,
        incentive_hint: rating.incentiveHint,
        remarks: data.remarks,
        enteredBy: adminUser.userId,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ score }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
