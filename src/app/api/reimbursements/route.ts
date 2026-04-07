import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Reimbursement from "@/models/Reimbursement";
import Transaction from "@/models/Transaction";
import Wallet from "@/models/Wallet";
import { authenticate, requireRole } from "@/middleware/auth";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(2),
  category: z.enum(["travel", "food", "accommodation", "equipment", "medical", "training", "other"]),
  amount: z.number().positive(),
  description: z.string().min(5),
  bill_urls: z.array(z.string()).optional().default([]),
});

// GET /api/reimbursements
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

    const reimbursements = await Reimbursement.find(filter)
      .sort({ createdAt: -1 })
      .populate("employee", "name employeeId department")
      .populate("approved_by", "name")
      .lean();

    return NextResponse.json({ reimbursements });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/reimbursements — employee submits
export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticate();
    await connectDB();

    const body = await req.json();

    // Admin: approve/reject/pay
    if (body.action && authUser.role !== "employee") {
      await requireRole(req, "hr", "super_admin");
      const reim = await Reimbursement.findById(body.reimbursementId);
      if (!reim) return NextResponse.json({ error: "Not found" }, { status: 404 });

      if (body.action === "approve") {
        reim.status = "approved";
        reim.approved_by = authUser.userId as unknown as typeof reim.approved_by;
        reim.approved_at = new Date();
      } else if (body.action === "reject") {
        reim.status = "rejected";
        reim.reject_reason = body.reason ?? "No reason provided";
      } else if (body.action === "pay") {
        reim.status = "paid";
        reim.paid_at = new Date();
        // Record transaction
        const wallet = await Wallet.findOne({ employee: reim.employee });
        await Transaction.create({
          employee: reim.employee,
          type: "reimbursement_paid",
          amount: reim.amount,
          balance_after: wallet?.claimable_amount ?? 0,
          reference_id: reim._id,
          reference_model: "Reimbursement",
          description: `Reimbursement paid: ${reim.title}`,
        });
      }

      await reim.save();
      return NextResponse.json({ reimbursement: reim });
    }

    // Employee submit
    const data = CreateSchema.parse(body);
    const reim = await Reimbursement.create({ ...data, employee: authUser.userId });
    return NextResponse.json({ reimbursement: reim }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
