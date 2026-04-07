import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireRole } from "@/middleware/auth";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["employee", "hr", "lead", "super_admin"]).default("employee"),
  employeeId: z.string().min(1),
  department: z.string().min(1),
  designation: z.string().min(1),
  joiningDate: z.string(),
  phone: z.string().optional(),
});

// GET /api/users — HR/Admin: list all users
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "hr", "lead", "super_admin");
    await connectDB();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const filter: Record<string, unknown> = { isActive: true };
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/users — HR/Admin: create user
export async function POST(req: NextRequest) {
  try {
    await requireRole(req, "hr", "super_admin");
    await connectDB();

    const body = await req.json();
    const data = CreateUserSchema.parse(body);

    const exists = await User.findOne({ $or: [{ email: data.email }, { employeeId: data.employeeId }] });
    if (exists) {
      return NextResponse.json({ error: "Email or employeeId already exists" }, { status: 409 });
    }

    const user = await User.create({ ...data, joiningDate: new Date(data.joiningDate) });

    // Auto-create wallet
    const { getOrCreateWallet } = await import("@/services/walletService");
    await getOrCreateWallet(user._id);

    return NextResponse.json({ user: { ...user.toObject(), password: undefined } }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
