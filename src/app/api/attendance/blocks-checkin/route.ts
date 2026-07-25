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
import { getApiUserId } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import dayjs from "@/lib/dayjs";

// GET — check if today's check-in is blocked by an overdue sick-leave certificate.
// Called by GlobalAttendanceWidget before allowing check-in.
// Also stamps blocks_checkin = true on any newly-overdue leaves (compute-on-access).

export async function GET() {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const today = dayjs().format("YYYY-MM-DD");

  // Find leaves past their certificate deadline with no cert submitted
  const { data: overdue } = await supabase
    .from("sick_leaves")
    .select("id, from_date, to_date, certificate_deadline, blocks_checkin, cert_status")
    .eq("employee_id", userId)
    .eq("cert_status", "pending")
    .is("certificate_url", null)
    .lte("certificate_deadline", today);

  if (overdue?.length) {
    // Stamp blocks_checkin = true on all overdue
    await supabase
      .from("sick_leaves")
      .update({ blocks_checkin: true })
      .in("id", overdue.map(l => l.id));

    return NextResponse.json({ blocked: true, leaves: overdue.map(l => ({ ...l, blocks_checkin: true })) });
  }

  // Also check any leave already marked as blocking (late cert awaiting approval)
  const { data: alreadyBlocking } = await supabase
    .from("sick_leaves")
    .select("id, from_date, to_date, certificate_deadline, cert_status, certificate_url")
    .eq("employee_id", userId)
    .eq("blocks_checkin", true)
    .neq("cert_status", "approved");

  if (alreadyBlocking?.length) {
    return NextResponse.json({ blocked: true, leaves: alreadyBlocking });
  }

  return NextResponse.json({ blocked: false, leaves: [] });
}
