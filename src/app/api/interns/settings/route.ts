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

// GET /api/interns/settings
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("intern_module_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Fallback defaults if row missing (shouldn't happen — migration seeds it)
  return NextResponse.json({
    settings: data ?? {
      id: 1,
      default_holidays_per_month: 6,
      per_day_divisor: 30,
      auto_buffer_cycle: true,
      notes: null,
      updated_by: null,
      updated_at: null,
    },
  });
}

// POST /api/interns/settings
// Body: { default_holidays_per_month?, per_day_divisor?, auto_buffer_cycle?, notes?, updated_by? }
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await req.json();
    const updatable: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
    for (const k of ["default_holidays_per_month", "per_day_divisor", "auto_buffer_cycle", "notes", "updated_by"]) {
      if (k in body) updatable[k] = body[k];
    }
    const { data, error } = await supabase
      .from("intern_module_settings")
      .upsert(updatable, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ settings: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? "Unknown error" }, { status: 500 });
  }
}
