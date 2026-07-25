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

/**
 * REAL WALLET SERVICE
 * Fetches actual data from payroll_runs and incentives tables.
 */

export async function getWalletSummary(employeeId: string) {
  const supabase = getSupabaseAdmin();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 1. Fetch Wallet Totals (aggregating from incentives/payroll)
  // Note: If you have a dedicated 'wallets' table, you would query that here.
  // For now, we calculate from payroll_runs and incentives status.
  
  const { data: payrollData } = await supabase
    .from("payroll_runs")
    .select("net_pay, status, month, year")
    .eq("employee_id", employeeId);

  const { data: incentiveData } = await supabase
    .from("incentives")
    .select("total_amount, status")
    .eq("employee_id", employeeId);

  const payrollTotal = (payrollData || []).reduce((acc, p) => acc + (Number(p.net_pay) || 0), 0);
  const incentiveTotal = (incentiveData || []).reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
  const earned_total = payrollTotal + incentiveTotal;
  
  const claimable_amount = (incentiveData || [])
    .filter(i => i.status === 'claimable')
    .reduce((acc, i) => acc + Number(i.total_amount), 0);

  const locked_amount = (incentiveData || [])
    .filter(i => i.status === 'locked')
    .reduce((acc, i) => acc + Number(i.total_amount), 0);

  // 2. Calculate "This Month's Salary"
  const this_month_payout = (payrollData || [])
    .filter(p => p.month === currentMonth && p.year === currentYear)
    .reduce((acc, p) => acc + Number(p.net_pay), 0);

  // 3. Get Recent Transactions
  const { data: recentPayouts } = await supabase
    .from("payroll_runs")
    .select("id, net_pay, status, month, year, created_at")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(3);

  const transactions = (recentPayouts || []).map(p => ({
    id: p.id,
    type: "payroll_payout",
    amount: Number(p.net_pay),
    description: `Salary Payout - ${new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' })} ${p.year}`,
    status: p.status,
    created_at: p.created_at
  }));

  return {
    wallet: {
      id: employeeId,
      employee_id: employeeId,
      earned_total: earned_total || 0,
      locked_amount: locked_amount || 0,
      claimable_amount: claimable_amount || 0,
      this_month_payout: this_month_payout || 0,
      updated_at: new Date().toISOString()
    },
    transactions
  };
}
