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

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getActor, isAdmin } from "@/lib/onboarding/server";
import { PAYROLL_INTERN_EMAILS } from "@/lib/payroll-access";
import { logAudit } from "@/lib/audit";

// GET /api/interns/activity
//
// Admin-only. Returns the full audit trail of the scoped payroll-intern
// account(s) — every stipend/holiday/payment action they performed — so an
// admin can see exactly what the intern helper has done. Powers the realtime
// "Intern Activity" page.
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(actor)) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = getSupabaseAdmin();

  // Resolve the scoped account(s) → employee ids.
  const emails = PAYROLL_INTERN_EMAILS.map((e) => e.toLowerCase());
  const { data: accounts } = await supabase
    .from("employees")
    .select("id, name, email, employee_id")
    .in("email", emails);

  const ids = (accounts ?? []).map((a) => a.id);
  if (ids.length === 0) {
    return NextResponse.json({ account: null, events: [], stats: { total: 0, payments: 0, holidays: 0 } });
  }

  const { data: events, error } = await supabase
    .from("audit_logs")
    .select("id, action, section, summary, target_type, target_id, actor_name, actor_emp_id, actor_role, created_at")
    .in("user_id", ids)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch presence
  const { data: presences } = await supabase
    .from("user_presence")
    .select("user_id, last_seen, current_path, status")
    .in("user_id", ids);

  const list = events ?? [];
  const stats = {
    total: list.length,
    payments: list.filter((e) => e.action?.includes("payment")).length,
    holidays: list.filter((e) => e.action === "internship.cycle.update" && /holiday/i.test(e.summary || "")).length,
  };

  return NextResponse.json({
    account: accounts?.[0] ?? null,
    presence: presences?.find((p) => p.user_id === accounts?.[0]?.id) ?? null,
    events: list,
    stats,
  });
}

// POST /api/interns/activity
//
// Scoped payroll intern logging endpoint.
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();

  // Retrieve user details from employees table to verify identity
  const { data: emp } = await supabase
    .from("employees")
    .select("email, name, role")
    .eq("id", actor.userId)
    .single();

  if (!emp) return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { action, summary, section, targetType, targetId } = body;

  if (!action || !summary) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await logAudit({
    actorId: actor.userId,
    actorName: emp.name,
    actorRole: emp.role,
    action,
    section: section || "Internship",
    summary,
    targetType: targetType || null,
    targetId: targetId || null,
  });

  return NextResponse.json({ success: true });
}
