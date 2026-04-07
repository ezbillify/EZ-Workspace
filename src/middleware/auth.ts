import { NextRequest, NextResponse } from "next/server";
import { getSession, SessionData } from "@/lib/session";

export type Role = "employee" | "hr" | "lead" | "super_admin";

export async function authenticate(): Promise<SessionData> {
  const session = await getSession();
  if (!session.userId) throw new Error("No session");
  return { userId: session.userId, email: session.email, role: session.role };
}

export async function requireRole(
  _req: NextRequest,
  ...roles: Role[]
): Promise<SessionData> {
  const payload = await authenticate();
  if (!roles.includes(payload.role)) {
    throw new Error(`Access denied. Required role: ${roles.join(" or ")}`);
  }
  return payload;
}

export function withAuth(
  handler: (req: NextRequest, user: SessionData) => Promise<NextResponse>,
  ...roles: Role[]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = roles.length > 0 ? await requireRole(req, ...roles) : await authenticate();
      return await handler(req, user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unauthorized";
      const status = message.includes("Access denied") ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }
  };
}

export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
