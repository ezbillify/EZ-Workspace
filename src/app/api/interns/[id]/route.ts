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

interface RouteCtx { params: Promise<{ id: string }> }

// PATCH /api/interns/[id]
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;
  try {
    const body = await req.json();
    const updatable: Record<string, unknown> = {};
    for (const k of ["full_name","intern_id","upi_id","stipend_amount","joining_date","starting_date","billing_date","is_active","notes"]) {
      if (k in body) updatable[k] = body[k];
    }
    if (Object.keys(updatable).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase.from("interns").update(updatable).eq("id", id).select("*").single();
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Intern ID already in use." }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ intern: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/interns/[id]
// Soft-delete: sets is_active = false. Use ?hard=true for actual delete.
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;
  const hard = req.nextUrl.searchParams.get("hard") === "true";
  try {
    if (hard) {
      const { error } = await supabase.from("interns").delete().eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("interns").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? "Unknown error" }, { status: 500 });
  }
}
