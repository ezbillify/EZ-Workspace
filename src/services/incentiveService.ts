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
import { calculateFinalIncentive } from "@/lib/incentiveMath";

function mapGrant(r: any) {
  return {
    _id: r.id,
    id: r.id,
    employee_id: r.employee_id,
    month: r.month,
    year: r.year,
    fixed_amount: Number(r.fixed_amount ?? 0),
    variable_amount: Number(r.variable_amount ?? 0),
    amount: Number(r.amount ?? 0),
    base_amount: Number(r.fixed_amount ?? 0) + Number(r.variable_amount ?? 0),
    employee_multiplier: Number(r.employee_multiplier ?? 1),
    company_multiplier: Number(r.company_multiplier ?? 1),
    status: r.status,
    notes: r.notes,
    created_at: r.created_at,
    employee: {
      name: r.emp?.name ?? "Unknown",
      employeeId: r.emp?.employee_id ?? "",
    },
  };
}

export async function awardIncentive(
  employeeId: string,
  fixedAmount: number,
  variableAmount: number,
  month: number,
  year: number,
  notes?: string,
  awardedBy?: string,
  employeeMultiplier = 1.0,
  companyMultiplier = 1.0
) {
  const supabase = getSupabaseAdmin();
  const finalAmount = calculateFinalIncentive(fixedAmount, variableAmount, employeeMultiplier, companyMultiplier);

  const { data, error } = await supabase
    .from("incentive_grants")
    .upsert(
      {
        employee_id: employeeId,
        month,
        year,
        fixed_amount: fixedAmount,
        variable_amount: variableAmount,
        employee_multiplier: employeeMultiplier,
        company_multiplier: companyMultiplier,
        amount: finalAmount,
        status: "locked",
        notes: notes ?? null,
        awarded_by: awardedBy ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,month,year" }
    )
    .select("id, employee_id, month, year, fixed_amount, variable_amount, amount, employee_multiplier, company_multiplier, status, notes, created_at")
    .single();

  if (error) throw new Error(error.message);

  const { data: emp } = await supabase
    .from("employees")
    .select("name, employee_id")
    .eq("id", employeeId)
    .single();

  return mapGrant({ ...data, emp });
}

export async function processVesting() {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 1);

  const { data, error } = await supabase
    .from("incentive_grants")
    .update({
      status: "claimable",
      vested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("status", "locked")
    .lt("created_at", cutoff.toISOString())
    .select("id");

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

export async function getIncentiveSummary(employeeId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("incentive_grants")
    .select("*")
    .eq("employee_id", employeeId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) return { incentives: [] };

  // Fetch employee info once
  const { data: emp } = await supabase
    .from("employees")
    .select("name, employee_id")
    .eq("id", employeeId)
    .single();

  const incentives = data.map((r) => mapGrant({ ...r, emp }));
  return { incentives };
}

export async function holdForBonus(incentiveId: string, _userId?: string, holdMonths = 1) {
  return { id: incentiveId, status: "held", hold_months: holdMonths };
}

export async function calculateHoldProjection(baseAmount: number) {
  return {
    immediate: baseAmount,
    hold_1m: parseFloat((baseAmount * 1.05).toFixed(2)),
    hold_2m: parseFloat((baseAmount * 1.10).toFixed(2)),
  };
}
