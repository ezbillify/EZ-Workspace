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

import { getSupabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";

export interface AuditChange { from: any; to: any; }

export interface LogAuditOpts {
  actorId?: string | null;        // employee id of the person doing the action
  actorName?: string | null;      // optional override (e.g. a candidate, not an employee)
  actorRole?: string | null;
  action: string;                 // machine action, e.g. "onboarding.approve"
  section: string;                // human section, e.g. "Onboarding"
  summary: string;                // human-readable one-liner for the log sheet
  targetType?: string | null;     // e.g. "onboarding_packet", "employee"
  targetId?: string | null;
  changes?: Record<string, AuditChange> | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ip?: string | null;
}

/** Field-level diff between two plain objects → { field: {from, to} } (only changed keys). */
export function diffObjects(before?: Record<string, any> | null, after?: Record<string, any> | null): Record<string, AuditChange> | null {
  const b = before || {};
  const a = after || {};
  const out: Record<string, AuditChange> = {};
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  for (const k of keys) {
    if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) out[k] = { from: b[k] ?? null, to: a[k] ?? null };
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Record one entry in the universal Master Log Sheet (audit_logs).
 * Best-effort: never throws into the calling flow.
 */
export async function logAudit(opts: LogAuditOpts): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    let ip = opts.ip ?? null;
    if (!ip) {
      try {
        const headerList = await headers();
        const forwarded = headerList.get("x-forwarded-for");
        ip = forwarded ? forwarded.split(",")[0].trim() : headerList.get("x-real-ip") || null;
      } catch {}
    }

    let name = opts.actorName ?? null;
    let role = opts.actorRole ?? null;
    let empId: string | null = null;

    if (opts.actorId) {
      const { data } = await supabase
        .from("employees")
        .select("name, employee_id, role")
        .eq("id", opts.actorId)
        .maybeSingle();
      if (data) {
        name = name ?? (data as any).name ?? null;
        empId = (data as any).employee_id ?? null;
        role = role ?? (data as any).role ?? null;
      }
    }

    const changes = opts.changes ?? diffObjects(opts.before, opts.after);

    // audit_logs carries two legacy NOT-NULL columns from the original table:
    //   table_name (text) and record_id (uuid). logAudit historically omitted both,
    //   so EVERY call failed silently on the not-null constraint. Always populate
    //   them: record_id must be a valid uuid (target if it's one, else the actor,
    //   else the nil uuid) so the insert never violates the type/not-null.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const targetIdStr = opts.targetId != null ? String(opts.targetId) : null;
    const recordId =
      (targetIdStr && UUID_RE.test(targetIdStr) && targetIdStr) ||
      (opts.actorId && UUID_RE.test(opts.actorId) && opts.actorId) ||
      "00000000-0000-0000-0000-000000000000";

    await supabase.from("audit_logs").insert({
      user_id: opts.actorId ?? null,
      action: opts.action,
      table_name: opts.targetType ?? opts.section ?? "system",
      record_id: recordId,
      target_type: opts.targetType ?? null,
      target_id: targetIdStr,
      actor_name: name,
      actor_emp_id: empId,
      actor_role: role,
      section: opts.section,
      summary: opts.summary,
      changes,
      ip_address: ip,
      metadata: {},
    });
  } catch (e: any) {
    console.error("[audit] failed to record:", e?.message);
  }
}
