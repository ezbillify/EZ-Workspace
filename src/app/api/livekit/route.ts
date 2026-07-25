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

import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const room     = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  const userId   = req.nextUrl.searchParams.get("userId");
  const canPublish = req.nextUrl.searchParams.get("canPublish") !== "false";

  if (!room || !username) {
    return NextResponse.json({ error: "Missing room or username" }, { status: 400 });
  }

  const apiKey    = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl     = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "Livekit not configured — add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL to .env.local" }, { status: 503 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId || username,
    name: username,
    ttl: "4h",
  });

  at.addGrant({
    roomJoin:       true,
    room,
    canPublish,
    canSubscribe:   true,
    canPublishData: true,
  });

  // Mark meeting as active when first token is issued
  if (userId) {
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("meetings")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("room_name", room)
        .eq("status", "scheduled");

      await supabase.from("meeting_participants")
        .update({ joined_at: new Date().toISOString() })
        .eq("employee_id", userId)
        .is("joined_at", null);
    } catch (_) {}
  }

  return NextResponse.json({ token: await at.toJwt(), wsUrl });
}
