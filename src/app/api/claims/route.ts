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
import { authenticate } from "@/middleware/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/claims — HR/Admin view all claims
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase.from("claims").select(`
      id, amount, status, cycle, queue_position, requested_at,
      employee:employees(name, employee_id, department),
      incentive:incentives(total_amount, month, year)
    `);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: claims, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ claims });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/claims — employee submits a claim
export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticate();
    const supabase = getSupabaseAdmin();
    const body = await req.json();

    if (body.action === "advance_cycle") {
      // Logic for advancing cycle over claims
      await supabase.from("claims").update({ status: "approved" }).eq("status", "pending");
      return NextResponse.json({ message: "Cycle advanced" });
    }

    if (body.action === "process") {
       await supabase.from("claims").update({ status: "approved" }).eq("id", body.claimId);
       return NextResponse.json({ message: "Claim processed successfully" });
    }

    // Submit a claim
    const { incentiveId } = body;
    const { data: incentive, error: incError } = await supabase.from("incentives").select("total_amount, employee_id").eq("id", incentiveId).single();
    if (incError || !incentive) throw new Error(incError?.message || "Incentive not found");

    const { data, error: insError } = await supabase.from("claims").insert({
       employee_id: incentive.employee_id,
       incentive_id: incentiveId,
       amount: incentive.total_amount,
       status: "pending"
    }).select().single();

    if (insError) throw new Error(insError.message);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/claims — admin processes claim
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await authenticate();
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { claimId } = body;

    await supabase.from("claims").update({ status: "processed" }).eq("id", claimId);
    return NextResponse.json({ message: "Claim processed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process claim" }, { status: 500 });
  }
}
