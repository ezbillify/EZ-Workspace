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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;
  try {
    const { data, error } = await supabase
      .from("subscription_assignments")
      .select(`
        *,
        teams ( name ),
        employees ( name, email, employee_id, department, designation )
      `)
      .eq("subscription_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ assignments: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;
  try {
    const body = await req.json();
    const {
      assignment_type, department_name, team_id, employee_id,
      seats_allocated, access_email, access_login, access_note,
    } = body;

    if (!assignment_type) {
      return NextResponse.json({ error: "assignment_type is required" }, { status: 400 });
    }

    // ── Seat capacity guard ──────────────────────────────────────────────────
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("total_seats, name")
      .eq("id", id)
      .single();

    if (sub) {
      const { data: existing } = await supabase
        .from("subscription_assignments")
        .select("seats_allocated")
        .eq("subscription_id", id);

      const usedSeats = (existing || []).reduce((sum: number, a: { seats_allocated: number }) => sum + (a.seats_allocated || 0), 0);
      const requested = Number(seats_allocated) || 1;
      const available = sub.total_seats - usedSeats;

      if (requested > available) {
        return NextResponse.json(
          { error: `Only ${available} seat${available !== 1 ? "s" : ""} available for ${sub.name} (${usedSeats}/${sub.total_seats} already allocated)` },
          { status: 400 }
        );
      }
    }

    // Resolve access_email if not provided
    let resolvedEmail = access_email || null;
    if (!resolvedEmail && employee_id) {
      const { data: emp } = await supabase
        .from("employees")
        .select("email")
        .eq("id", employee_id)
        .single();
      resolvedEmail = emp?.email || null;
    }

    const { data, error } = await supabase
      .from("subscription_assignments")
      .insert({
        subscription_id: id,
        assignment_type,
        department_name: department_name || null,
        team_id:         team_id         || null,
        employee_id:     employee_id     || null,
        seats_allocated: seats_allocated ?? 1,
        access_email:    resolvedEmail,
        access_login:    access_login    || null,
        access_note:     access_note     || null,
      })
      .select(`
        *,
        teams ( name ),
        employees ( name, email, employee_id, department, designation )
      `)
      .single();

    if (error) throw error;
    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
