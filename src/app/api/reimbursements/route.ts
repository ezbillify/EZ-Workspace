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
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase.from("reimbursements").select(`
      *,
      employee:employees(name, employee_id, department)
    `);
    
    if (status && status !== "all") query = query.eq("status", status);

    const { data: claims, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ claims });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();

    if (body.action === "approve") {
       await supabase.from("reimbursements").update({ status: "approved" }).eq("id", body.reimbursementId);
       return NextResponse.json({ message: "Reimbursement approved" });
    }
    if (body.action === "reject") {
       await supabase.from("reimbursements").update({ status: "rejected", reason: body.reason }).eq("id", body.reimbursementId);
       return NextResponse.json({ message: "Reimbursement rejected" });
    }
    if (body.action === "pay") {
       await supabase.from("reimbursements").update({ status: "paid" }).eq("id", body.reimbursementId);
       return NextResponse.json({ message: "Reimbursement paid" });
    }

    const { employeeId, amount, reason, receipt_url } = body;
    const { data } = await supabase.from("reimbursements").insert({
       employee_id: employeeId,
       amount, reason, receipt_url, status: "pending"
    }).select().single();

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
