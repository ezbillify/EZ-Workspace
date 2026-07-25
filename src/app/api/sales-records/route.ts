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

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = req.nextUrl;
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let query = supabase.from("sales_records").select("*");
  if (employeeId) query = query.eq("employee_id", employeeId);
  if (month)      query = query.eq("month", Number(month));
  if (year)       query = query.eq("year", Number(year));

  const { data, error } = await query
    .order("year",  { ascending: false })
    .order("month", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ records: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { employee_id, month, year, amount_achieved, notes, entered_by } = body;

  if (!employee_id || !month || !year) {
    return NextResponse.json({ error: "employee_id, month, year are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sales_records")
    .upsert(
      {
        employee_id,
        month:            Number(month),
        year:             Number(year),
        amount_achieved:  Number(amount_achieved) || 0,
        notes:            notes ?? null,
        entered_by:       entered_by ?? null,
        updated_at:       new Date().toISOString(),
      },
      { onConflict: "employee_id,month,year" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}
