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
import { getActor } from "@/lib/onboarding/server";

// Serve a candidate's display picture by email for internal onboarding views.
// Prefers the dedicated profile_photo; falls back to the verification selfie so
// existing candidates (uploaded before profile_photo existed) still show a DP.
export async function GET(req: NextRequest) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: reqs } = await supabase
    .from("candidate_document_requests")
    .select("id")
    .ilike("candidate_email", email);
  const ids = (reqs || []).map((r) => r.id);
  if (!ids.length) return NextResponse.json({ error: "No documents" }, { status: 404 });

  // Try the profile photo first, then fall back to the face selfie.
  let fileShareId: string | null = null;
  for (const type of ["profile_photo", "face_photo"]) {
    const { data: doc } = await supabase
      .from("candidate_documents")
      .select("file_share_id")
      .eq("document_type", type)
      .in("request_id", ids)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (doc?.file_share_id) { fileShareId = doc.file_share_id; break; }
  }
  if (!fileShareId) return NextResponse.json({ error: "No photo" }, { status: 404 });

  const { data: share } = await supabase
    .from("mail_file_shares")
    .select("storage_url")
    .eq("id", fileShareId)
    .maybeSingle();

  const m = (share?.storage_url || "").match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!m) return NextResponse.json({ error: "Unavailable" }, { status: 404 });

  const buffer = Buffer.from(m[2], "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": m[1] || "image/jpeg", "Cache-Control": "private, max-age=300" },
  });
}
