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

// GET — Fetch responses for a ticket
export async function GET(req: NextRequest) {
  const ticketId = req.nextUrl.searchParams.get("ticketId");

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("ticket_responses")
      .select(`
        *,
        sender:employees!ticket_responses_sender_id_fkey(id, name, email, role, department)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ responses: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/support/responses]", err);
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}

// POST — Add a response to a ticket
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticket_id, sender_id, message, is_internal } = body;

    if (!ticket_id || !sender_id || !message) {
      return NextResponse.json({ error: "ticket_id, sender_id, message are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("ticket_responses")
      .insert({
        ticket_id,
        sender_id,
        message,
        is_internal: is_internal ?? false,
      })
      .select(`
        *,
        sender:employees!ticket_responses_sender_id_fkey(id, name, email, role, department)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ response: data });
  } catch (err: any) {
    console.error("[POST /api/support/responses]", err);
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
