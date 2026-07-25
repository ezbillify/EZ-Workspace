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
import { signedPdfUrl, type DocKind } from "@/lib/onboarding/pdf";

type Ctx = { params: Promise<{ id: string }> };

const COL: Record<DocKind, "offer_pdf_url" | "nda_pdf_url" | "handbook_pdf_url"> = {
  offer: "offer_pdf_url",
  nda: "nda_pdf_url",
  handbook: "handbook_pdf_url",
};

// GET /api/onboarding/[id]/pdf?doc=offer|nda|handbook → 302 to a signed URL.
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = (req.nextUrl.searchParams.get("doc") || "offer") as DocKind;
  if (!COL[doc]) return NextResponse.json({ error: "Invalid doc" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: packet } = await supabase
    .from("onboarding_packets")
    .select("id, created_by, approver_id, offer_pdf_url, nda_pdf_url, handbook_pdf_url")
    .eq("id", id)
    .maybeSingle();
  if (!packet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAdmin(actor) && packet.created_by !== actor.userId && packet.approver_id !== actor.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const path = (packet as any)[COL[doc]] as string | null;
  if (!path) return NextResponse.json({ error: "PDF not generated yet" }, { status: 404 });

  const url = await signedPdfUrl(path);
  if (!url) return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
  return NextResponse.redirect(url);
}
