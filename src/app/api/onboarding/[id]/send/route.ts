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

// POST /api/onboarding/[id]/send — (re)dispatch the onboarding e-sign email.
// Used to RETRY delivery after a send failed (e.g. the PDF/Chrome error left the
// packet "approved" with no sent_at) or to re-send the magic link to the candidate.
// Allowed for an admin OR the packet's creator (owner).
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: packet } = await supabase
    .from("onboarding_packets")
    .select("id, status, created_by, candidate_email")
    .eq("id", id)
    .maybeSingle();
  if (!packet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAdmin(actor) && packet.created_by !== actor.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["approved", "sent", "viewed"].includes(packet.status)) {
    return NextResponse.json({ error: "Approve the onboarding before sending." }, { status: 400 });
  }

  try {
    const result = await dispatchOnboarding(id, { req });
    await logAudit({
      actorId: actor.userId, action: "onboarding.resend", section: "Onboarding",
      summary: `Re-sent the onboarding e-sign email to ${packet.candidate_email}`,
      targetType: "onboarding_packet", targetId: id,
    });
    return NextResponse.json({ status: "sent", ...result });
  } catch (e: any) {
    return NextResponse.json({ error: `Sending failed: ${e.message}. You can retry.` }, { status: 502 });
  }
}
