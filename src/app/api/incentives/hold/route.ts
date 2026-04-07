import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/middleware/auth";
import { holdForBonus, calculateHoldProjection } from "@/services/incentiveService";
import { z } from "zod";

const HoldSchema = z.object({
  incentiveId: z.string(),
  holdMonths: z.union([z.literal(1), z.literal(2)]),
});

// POST /api/incentives/hold — employee holds for bonus
export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const body = await req.json();
    const { incentiveId, holdMonths } = HoldSchema.parse(body);

    const incentive = await holdForBonus(incentiveId, authUser.userId, holdMonths);
    return NextResponse.json({ incentive });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// GET /api/incentives/hold?amount=5000 — preview hold bonus
export async function GET(req: NextRequest) {
  try {
    authenticate();
    const { searchParams } = new URL(req.url);
    const amount = parseFloat(searchParams.get("amount") ?? "0");
    if (!amount) return NextResponse.json({ error: "amount required" }, { status: 400 });

    const projection = await calculateHoldProjection(amount);
    return NextResponse.json({ projection });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
