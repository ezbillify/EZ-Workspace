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

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;
    const interviewId = formData.get("interviewId") as string;
    const interviewerId = formData.get("interviewerId") as string;

    if (!file || !interviewId || !interviewerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fileName = `${interviewId}_${Date.now()}.webm`;
    const filePath = `recordings/${interviewerId}/${fileName}`;

    const { data, error: uploadErr } = await supabase.storage
      .from("interview-recordings")
      .upload(filePath, file, {
        contentType: "video/webm",
        upsert: true
      });

    if (uploadErr) throw uploadErr;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("interview-recordings")
      .getPublicUrl(filePath);

    // Update interview record
    await supabase.from("interviews")
      .update({ recording_url: publicUrl })
      .eq("interview_id", interviewId);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("[Record API] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
