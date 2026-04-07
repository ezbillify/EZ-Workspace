import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { authenticate, requireRole } from "@/middleware/auth";

// GET /api/users/:id — employee can only fetch their own
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticate();
    const { id } = await params;
    await connectDB();

    // Employees can only view their own profile
    if (user.role === "employee" && user.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const found = await User.findById(id).select("-password");
    if (!found) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user: found });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// PATCH /api/users/:id — HR/Admin only
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, "hr", "super_admin");
    const { id } = await params;
    await connectDB();

    const body = await req.json();
    const allowed = ["name", "department", "designation", "phone", "isActive", "role"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
