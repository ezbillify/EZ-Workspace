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

// ── GET /api/meetings/minutes?meeting_id=xxx ─────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const meetingId = req.nextUrl.searchParams.get("meeting_id");
  if (!meetingId) return NextResponse.json({ error: "meeting_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("meeting_minutes")
    .select(`*, creator:employees!meeting_minutes_created_by_fkey(id,name)`)
    .eq("meeting_id", meetingId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── POST /api/meetings/minutes ───────────────────────────────────────────────
// Body: { meeting_id, created_by, transcript?, summary?, key_topics?, decisions?, action_items?, status? }
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { meeting_id, created_by, ...rest } = body;

  if (!meeting_id || !created_by)
    return NextResponse.json({ error: "meeting_id and created_by required" }, { status: 400 });

  const { data, error } = await supabase
    .from("meeting_minutes")
    .upsert({ meeting_id, created_by, ...rest }, { onConflict: "meeting_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── PATCH /api/meetings/minutes ──────────────────────────────────────────────
// Body: { meeting_id, ...fields }
export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { meeting_id, ...fields } = await req.json();
  if (!meeting_id) return NextResponse.json({ error: "meeting_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("meeting_minutes")
    .update(fields)
    .eq("meeting_id", meeting_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
