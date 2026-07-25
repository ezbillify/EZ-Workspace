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
import { getActor, isAdmin } from "@/lib/onboarding/server";
import { dispatchOnboarding } from "@/lib/onboarding/dispatch";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

// POST /api/onboarding/[id]/approve — admin approves, then generates PDFs and
// emails the candidate (from the form creator's Zoho mailbox) with a magic link.
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(actor)) return NextResponse.json({ error: "Admin approval only" }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const { data: packet } = await supabase
    .from("onboarding_packets")
    .select("id, status, candidate_email")
    .eq("id", id)
    .maybeSingle();
  if (!packet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["pending_approval", "approved"].includes(packet.status)) {
    return NextResponse.json({ error: "Only pending submissions can be approved." }, { status: 400 });
  }
  if (!packet.candidate_email) {
    return NextResponse.json({ error: "Candidate email is missing." }, { status: 400 });
  }

  // Mark approved first (so the record reflects the decision even if dispatch is retried).
  await supabase
    .from("onboarding_packets")
    .update({ status: "approved", approver_id: actor.userId, approved_at: new Date().toISOString(), rejection_note: null })
    .eq("id", id);

  try {
    const result = await dispatchOnboarding(id, { req });
    await logAudit({
      actorId: actor.userId, action: "onboarding.approve", section: "Onboarding",
      summary: `Approved and sent the onboarding offer to ${packet.candidate_email}`,
      targetType: "onboarding_packet", targetId: id, changes: { status: { from: packet.status, to: "sent" } },
    });
    return NextResponse.json({ status: "sent", ...result });
  } catch (e: any) {
    // Approved but delivery failed — admin can retry via the send endpoint.
    return NextResponse.json(
      { error: `Approved, but sending failed: ${e.message}. You can retry sending.`, status: "approved" },
      { status: 502 }
    );
  }
}
