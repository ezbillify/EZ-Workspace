import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate, requireRole } from "@/middleware/auth";
import { submitClaim, processClaim, advanceCycle } from "@/services/payoutService";
import Claim from "@/models/Claim";
import { z } from "zod";

const ClaimSchema = z.object({
  incentiveId: z.string(),
});

// GET /api/claims — list claims
export async function GET(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = {};

    if (authUser.role === "employee") {
      filter.employee = authUser.userId;
    } else {
      const empId = searchParams.get("employeeId");
      if (empId) filter.employee = empId;
    }

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const cycle = searchParams.get("cycle");
    if (cycle) filter.cycle = parseInt(cycle);

    const claims = await Claim.find(filter)
      .sort({ createdAt: -1 })
      .populate("employee", "name employeeId department")
      .populate("incentive", "amount base_amount month year")
      .lean();

    return NextResponse.json({ claims });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/claims — submit or process claim
export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const body = await req.json();

    // Admin: process a claim
    if (body.action === "process" && authUser.role !== "employee") {
      await requireRole(req, "hr", "super_admin");
      await processClaim(body.claimId, authUser.userId);
      return NextResponse.json({ message: "Claim processed" });
    }

    // Admin: advance cycle
    if (body.action === "advance_cycle") {
      await requireRole(req, "super_admin");
      await advanceCycle();
      return NextResponse.json({ message: "Cycle advanced" });
    }

    // Employee: submit a claim
    const { incentiveId } = ClaimSchema.parse(body);
    const result = await submitClaim(authUser.userId, incentiveId);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
