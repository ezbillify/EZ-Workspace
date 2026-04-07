import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PriorityRequest from "@/models/PriorityRequest";
import { authenticate, requireRole } from "@/middleware/auth";
import { submitPriorityRequest, reviewPriorityRequest } from "@/services/payoutService";
import { z } from "zod";

const SubmitSchema = z.object({
  incentiveId: z.string(),
  reason: z.string().min(10),
});

// GET /api/priority
export async function GET(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const filter: Record<string, unknown> = {};
    if (authUser.role === "employee") {
      filter.employee = authUser.userId;
    }

    const status = new URL(req.url).searchParams.get("status");
    if (status) filter.status = status;

    const requests = await PriorityRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("employee", "name employeeId department")
      .populate("incentive", "amount base_amount month year")
      .populate("reviewed_by", "name")
      .lean();

    return NextResponse.json({ requests });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/priority
export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const body = await req.json();

    // Admin: review
    if (body.action === "review") {
      await requireRole(req, "hr", "super_admin");
      await reviewPriorityRequest(
        body.requestId,
        authUser.userId,
        body.decision,
        body.rejectReason
      );
      return NextResponse.json({ message: "Priority request reviewed" });
    }

    // Employee: submit
    const { incentiveId, reason } = SubmitSchema.parse(body);
    const request = await submitPriorityRequest(authUser.userId, incentiveId, reason);
    return NextResponse.json({ request }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
