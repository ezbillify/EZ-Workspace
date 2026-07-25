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
import { getSession } from "@/lib/session";

/**
 * POST /api/auth/save-session
 *
 * Called by AuthProvider after successful Supabase authentication to persist
 * the iron-session (np_session cookie). This is required so that server-side
 * routes like /api/auth/saml/sso can identify the logged-in user via iron-session
 * even after a full-page redirect (e.g., SAML SSO → Zoho → back to dashboard).
 *
 * Security: Validates the Supabase JWT token before saving the session.
 */
export async function POST(req: NextRequest) {
  try {

    const body = await req.json();
    const { access_token, refresh_token, employee_id, role, email } = body;

    if (!access_token || !employee_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the token is valid with Supabase
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(access_token);

    if (error || !user || user.id !== employee_id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Save to iron-session so SAML SSO route can read userId
    const session = await getSession();
    session.userId = employee_id;
    session.email = email || user.email || "";
    session.role = role as any;
    await session.save();

    console.log(`[save-session] Iron-session saved for user: ${employee_id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[save-session] Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
