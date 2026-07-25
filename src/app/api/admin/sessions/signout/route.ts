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
import { getActor, isAdmin } from "@/lib/onboarding/server";
import { logAudit } from "@/lib/audit";

// POST /api/admin/sessions/signout — admin force-ends a user's workspace session.
// Always removes them from the live presence board; additionally attempts a global
// token revocation where the auth server supports it.
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(actor)) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { user_id } = await req.json().catch(() => ({}));
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  let revoked = false;
  try {
    const adminApi = supabase.auth.admin as any;
    if (typeof adminApi.signOut === "function") {
      await adminApi.signOut(user_id, "global");
      revoked = true;
    }
  } catch {
    // Token revocation not supported on this auth server — presence clear still applies.
  }

  // Drop them from the live presence board immediately.
  await supabase.from("user_presence").delete().eq("user_id", user_id);

  const { data: emp } = await supabase
    .from("employees")
    .select("name, employee_id")
    .eq("id", user_id)
    .maybeSingle();

  await logAudit({
    actorId: actor.userId,
    action: "session.force_signout", section: "Security",
    summary: `Force-signed-out ${emp?.name || user_id}${revoked ? "" : " (presence cleared — token revocation unavailable)"}`,
    targetType: "employee", targetId: user_id,
  });

  return NextResponse.json({
    ok: true,
    revoked,
    message: revoked
      ? "User signed out globally — they must log in again."
      : "User removed from the live board; their session ends on next token refresh.",
  });
}
