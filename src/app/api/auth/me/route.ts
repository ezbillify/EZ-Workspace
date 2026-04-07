import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { authenticate } from "@/middleware/auth";

export async function GET() {
  try {
    const payload = await authenticate();
    await connectDB();

    const user = await User.findById(payload.userId).select("-password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
