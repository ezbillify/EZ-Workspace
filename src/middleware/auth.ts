/*
 * Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
 * 
 * WARNING & LIABILITY DISCLAIMER:
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
 * UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
 * ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, SessionData } from "@/lib/session";
import { createClient } from "@/lib/supabaseServer";

import { cache } from "react";

import { Role } from "@/types/database.types";

export const authenticate = cache(async (): Promise<SessionData> => {
  try {
    // 1. Try Supabase Session (Primary)
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (user && !authErr) {
      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select("role, email")
        .eq("id", user.id)
        .single();

      if (emp && !empErr) {
        return { 
          userId: user.id, 
          email: emp.email, 
          role: emp.role as any 
        };
      }
    } else if (authErr) {
      console.warn("[Auth] Supabase auth check failed:", authErr.message);
    }

    // 2. Try Iron Session (Legacy/Fallback)
    const session = await getSession();
    if (session.userId) {
      return { userId: session.userId, email: session.email, role: session.role };
    }

    console.warn("[Auth] No valid session found in Supabase or Iron Session");
    const error = new Error("Authentication required");
    (error as any).status = 401;
    throw error;
  } catch (err: any) {
    if (err.status) throw err;
    console.error("[Auth] Exception during authentication:", err.message);
    const error = new Error(err.message || "Authentication failed");
    (error as any).status = 401;
    throw error;
  }
});

export async function requireRole(
  _req: NextRequest,
  ...roles: Role[]
): Promise<SessionData> {
  const payload = await authenticate();
  if (!roles.includes(payload.role)) {
    const error = new Error(`Access denied. Required role: ${roles.join(" or ")}`);
    (error as any).status = 403;
    throw error;
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
    } catch (err: any) {
      const message = err.message || "Unauthorized";
      const status = err.status || 401;
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
