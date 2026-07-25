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

// GET /api/payslips?employeeId=...&month=...&year=...&status=...
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = req.nextUrl;
  const employeeId = searchParams.get("employeeId");
  const month      = searchParams.get("month");
  const year       = searchParams.get("year");
  const status     = searchParams.get("status");

  let query = supabase
    .from("payslips")
    .select("*, employee:employees!payslips_employee_id_fkey(name, employee_id, department, designation)");

  if (employeeId) query = query.eq("employee_id", employeeId);
  if (month)      query = query.eq("month", Number(month));
  if (year)       query = query.eq("year", Number(year));
  if (status)     query = query.eq("status", status);

  const { data, error } = await query
    .order("year",  { ascending: false })
    .order("month", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payslips: data ?? [] });
}

// POST /api/payslips — update status / notes on existing payslip
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { employee_id, month, year, status, notes, approved_by } = body;

  if (!employee_id || !month || !year) {
    return NextResponse.json({ error: "employee_id, month, year are required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    employee_id,
    month:      Number(month),
    year:       Number(year),
    notes:      notes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (status) {
    updates.status = status;
    if (status === "approved") {
      updates.approved_at = new Date().toISOString();
      if (approved_by) updates.approved_by = approved_by;
    }
    if (status === "released") {
      updates.released_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("payslips")
    .upsert(updates, { onConflict: "employee_id,month,year" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payslip: data });
}
