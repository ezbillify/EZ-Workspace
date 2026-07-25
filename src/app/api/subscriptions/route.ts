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

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search") || "";
  const status   = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";

  try {
    let query = supabase
      .from("subscriptions")
      .select(`
        *,
        subscription_assignments (
          id, subscription_id, assignment_type, department_name, seats_allocated,
          credentials_sent, sent_at, access_email, access_login, access_note,
          team_id, employee_id,
          teams ( name ),
          employees ( name, email, employee_id, department, designation )
        )
      `)
      .order("created_at", { ascending: false });

    if (search)   query = query.ilike("name", `%${search}%`);
    if (status)   query = query.eq("status", status);
    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ subscriptions: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await req.json();
    const {
      name, provider, category, cost_per_seat, total_seats,
      billing_cycle, currency, renewal_date, status, notes, website_url,
      filed_by_emp_id, filed_by_name, filed_by_dept, filed_by_desig, filed_by_uuid,
    } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    let payloadToInsert: any = {
      name,
      sub_number: "",
      provider:      provider     || null,
      category:      category     || "Software",
      cost_per_seat: cost_per_seat ?? 0,
      total_seats:   total_seats  ?? 1,
      billing_cycle: billing_cycle || "Monthly",
      currency:      currency     || "INR",
      renewal_date:  renewal_date || null,
      status:        status       || "active",
      notes:         notes        || null,
      website_url:   website_url  || null,
      filed_by_emp_id,
      filed_by_name,
      filed_by_dept,
      filed_by_desig,
      filed_by_uuid,
    };

    let { data, error } = await supabase
      .from("subscriptions")
      .insert(payloadToInsert)
      .select()
      .single();

    // Auto-fallback if billing_cycle column is missing from user's live DB schema
    if (error && error.code === 'PGRST204' && error.message.includes('billing_cycle')) {
      delete payloadToInsert.billing_cycle;
      const retryResult = await supabase.from("subscriptions").insert(payloadToInsert).select().single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error("SUPABASE ERROR:", error);
      throw error;
    }
    return NextResponse.json({ subscription: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
