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

// List the documents a candidate uploaded — by request_id, or by candidate email
// (the onboarding form uses email to surface a selected candidate's documents).
export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("request_id");
  const email = req.nextUrl.searchParams.get("email");
  const supabase = getSupabaseAdmin();

  let requestIds: string[] = [];
  if (requestId) {
    requestIds = [requestId];
  } else if (email) {
    const { data: reqs } = await supabase
      .from("candidate_document_requests")
      .select("id")
      .ilike("candidate_email", email)
      .eq("status", "submitted");
    requestIds = (reqs || []).map((r) => r.id);
  } else {
    return NextResponse.json({ error: "request_id or email required" }, { status: 400 });
  }

  if (!requestIds.length) return NextResponse.json({ documents: [] });

  const { data: docs, error } = await supabase
    .from("candidate_documents")
    .select("id, document_type, filename, file_type, file_size, created_at")
    .in("request_id", requestIds)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    documents: (docs || []).map((d) => ({
      ...d,
      url: `/api/admin/recruitment/documents/file?id=${d.id}`,
    })),
  });
}
