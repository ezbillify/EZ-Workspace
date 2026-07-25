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

// POST /api/presence — heartbeat: marks the current user active + their location.
// Optional `status` field: when provided, stored in user_presence.status (used for
// rich 7-state presence: available / online / idle / break / interview / busy / offline).
// Heartbeats from DashboardShell do NOT send status, so existing status is preserved.
export async function POST(req: Request) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ ok: false });
    const { path, status, device_id } = await req.json().catch(() => ({}));
    const deviceId = device_id || "default";
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();

    // Check if device_id column exists to support gradual migration rollouts
    const { error: colErr } = await supabase
      .from("user_presence")
      .select("device_id")
      .limit(1);
    const hasDeviceColumn = !colErr;

    let finalStatus = "available";

    // 1. If we have the device column, run composite query
    if (hasDeviceColumn) {
      const { data: existing } = await supabase
        .from("user_presence")
        .select("status")
        .eq("user_id", actor.userId)
        .eq("device_id", deviceId)
        .maybeSingle();

      finalStatus = status !== undefined && status !== null 
        ? status 
        : (existing?.status || "available");

      const userAgent = req.headers.get("user-agent") || "";
      let deviceName = "Unknown Device";
      const ua = userAgent.toLowerCase();
      if (ua.includes("iphone") || ua.includes("ipad")) {
        deviceName = "iOS Device";
      } else if (ua.includes("android")) {
        deviceName = "Android Device";
      } else if (ua.includes("macintosh") || ua.includes("mac os x")) {
        deviceName = "Mac";
      } else if (ua.includes("windows")) {
        deviceName = "Windows PC";
      } else if (ua.includes("linux")) {
        deviceName = "Linux PC";
      }

      const payload = {
        user_id: actor.userId,
        device_id: deviceId,
        last_seen: now,
        current_path: path || null,
        status: finalStatus,
        updated_at: now,
        user_agent: userAgent || null,
        device_name: deviceName,
      };

      await supabase
        .from("user_presence")
        .upsert(payload, { onConflict: "user_id,device_id" });
    } else {
      // 2. Fallback to old user_id-only presence model
      const { data: existing } = await supabase
        .from("user_presence")
        .select("status")
        .eq("user_id", actor.userId)
        .maybeSingle();

      finalStatus = status !== undefined && status !== null 
        ? status 
        : (existing?.status || "available");

      const payload = {
        user_id: actor.userId,
        last_seen: now,
        current_path: path || null,
        status: finalStatus,
        updated_at: now,
      };

      await supabase
        .from("user_presence")
        .upsert(payload, { onConflict: "user_id" });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[presence heartbeat error]", e.message);
    return NextResponse.json({ ok: false });
  }
}
