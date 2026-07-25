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
import { getSupabaseAdmin } from "@/lib/supabase";
import { computeCycle, cycleApplies } from "@/lib/internshipMath";

interface RouteCtx { params: Promise<{ id: string }> }

// GET /api/interns/[id]/unpaid
//
// Returns ALL unpaid cycles (persisted with status != paid, AND missing-but-due
// drafts) for an intern, from their billing_date up to the current month.
// Used by the Clear Backlog dialog.
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const supabase = getSupabaseAdmin();
  const { id: intern_id } = await params;

  const { data: intern, error: iErr } = await supabase
    .from("interns")
    .select("id, full_name, intern_id, upi_id, stipend_amount, joining_date, starting_date, billing_date")
    .eq("id", intern_id)
    .single();
  if (iErr || !intern) {
    return NextResponse.json({ error: "Intern not found" }, { status: 404 });
  }

  // All existing cycles for this intern
  const { data: existing, error: cErr } = await supabase
    .from("intern_stipend_cycles")
    .select("*")
    .eq("intern_id", intern_id);
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  const existingByKey = new Map<string, typeof existing[number]>(
    (existing ?? []).map(r => [`${r.year}-${r.month}`, r])
  );

  // Walk months from starting_date.month/year (to include buffer month if any)
  // to the current month/year.
  const start = new Date(intern.starting_date + "T00:00:00Z");
  const start_m = start.getUTCMonth() + 1;
  const start_y = start.getUTCFullYear();

  const now = new Date();
  const end_m = now.getUTCMonth() + 1;
  const end_y = now.getUTCFullYear();

  const unpaid: Array<{
    id: string | null;
    month: number;
    year: number;
    paid_days: number;
    buffer_paid_days: number;
    gross_amount: number;
    deductions: number;
    net_amount: number;
    payment_status: "pending" | "paid" | "failed";
    is_persisted: boolean;
  }> = [];

  let y = start_y;
  let m = start_m;
  while (y < end_y || (y === end_y && m <= end_m)) {
    const key = `${y}-${m}`;
    const row = existingByKey.get(key);

    if (row) {
      if (row.payment_status !== "paid") {
        unpaid.push({
          id: row.id,
          month: m,
          year: y,
          paid_days: row.paid_days,
          buffer_paid_days: row.buffer_paid_days ?? 0,
          gross_amount: Number(row.gross_amount),
          deductions: Number(row.deductions),
          net_amount: Number(row.net_amount),
          payment_status: row.payment_status,
          is_persisted: true,
        });
      }
    } else if (cycleApplies(intern.starting_date, intern.billing_date, m, y)) {
      const c = computeCycle({
        intern: {
          stipend_amount: Number(intern.stipend_amount),
          starting_date: intern.starting_date,
          billing_date: intern.billing_date,
        },
        month: m,
        year: y,
      });
      unpaid.push({
        id: null,
        month: m,
        year: y,
        paid_days: c.paid_days,
        buffer_paid_days: c.buffer_paid_days,
        gross_amount: c.gross_amount,
        deductions: 0,
        net_amount: c.net_amount,
        payment_status: "pending",
        is_persisted: false,
      });
    }

    m++;
    if (m > 12) { m = 1; y++; }
  }

  return NextResponse.json({
    intern: {
      id: intern.id,
      full_name: intern.full_name,
      intern_id: intern.intern_id,
      upi_id: intern.upi_id,
      stipend_amount: Number(intern.stipend_amount),
      joining_date: intern.joining_date,
      starting_date: intern.starting_date,
      billing_date: intern.billing_date,
    },
    unpaid,
  });
}
