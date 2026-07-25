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
import { getActor } from "@/lib/onboarding/server";
import { logAudit } from "@/lib/audit";

// Mark a candidate (who finished uploading documents) as ready for onboarding —
// this surfaces them in the onboarding "From Interview" picker.
export async function POST(req: Request) {
  try {
    const { request_id } = await req.json();
    if (!request_id) return NextResponse.json({ error: "request_id required" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: r } = await supabase
      .from("candidate_document_requests")
      .select("id, status, candidate_name")
      .eq("id", request_id)
      .maybeSingle();

    if (!r) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (r.status !== "submitted") {
      return NextResponse.json({ error: "Candidate hasn't uploaded their documents yet." }, { status: 400 });
    }

    const { error } = await supabase
      .from("candidate_document_requests")
      .update({ converted_to_onboard: true, converted_at: new Date().toISOString() })
      .eq("id", request_id);
    if (error) throw error;

    const actor = await getActor();
    await logAudit({
      actorId: actor?.userId ?? null,
      action: "recruitment.convert_to_onboard", section: "Recruitment",
      summary: `Marked ${r.candidate_name || "a candidate"} ready for onboarding`,
      targetType: "candidate_document_request", targetId: request_id,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[convert-to-onboard]", e);
    return NextResponse.json({ error: e.message || "Failed to convert" }, { status: 500 });
  }
}
