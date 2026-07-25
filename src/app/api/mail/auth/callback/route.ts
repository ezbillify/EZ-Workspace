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
import { exchangeCodeForTokens, zohoGet } from "@/lib/zoho-mail";
import { syncDomainFromZoho } from "@/lib/zoho-provisioning";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/admin/mail/config?error=${error || "no_code"}`);
  }

  const { data: config } = await supabase
    .from("zoho_config")
    .select("id, client_id, client_secret, redirect_uri")
    .limit(1)
    .maybeSingle();

  if (!config) {
    return NextResponse.redirect(`${appUrl}/admin/mail/config?error=no_config`);
  }

  const tokens = await exchangeCodeForTokens(
    config.client_id,
    config.client_secret,
    code,
    config.redirect_uri
  );

  if (!tokens?.access_token) {
    return NextResponse.redirect(`${appUrl}/admin/mail/config?error=token_failed`);
  }

  // Fetch admin account ID + org ID from Zoho
  let adminAccountId: string | null = null;
  let orgId: string | null = null;
  try {
    const accounts = await zohoGet(tokens.access_token, "/accounts");
    adminAccountId = accounts?.data?.[0]?.accountId ?? null;
  } catch {}
  try {
    const orgs = await zohoGet(tokens.access_token, "/organization");
    orgId = orgs?.data?.[0]?.orgId
         ?? orgs?.data?.[0]?.id
         ?? orgs?.data?.orgId
         ?? null;
  } catch {}

  if (!orgId) {
    orgId = process.env.ZOHO_ORG_ID || null;
  }

  await supabase.from("zoho_config").update({
    access_token:     tokens.access_token,
    refresh_token:    tokens.refresh_token,
    token_expiry:     new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    admin_account_id: adminAccountId,
    zoid:             orgId,
    org_id:           orgId,
    is_connected:     true,
    connected_at:     new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }).eq("id", config.id);

  // Auto-detect and persist the verified domain from Zoho (non-blocking)
  syncDomainFromZoho().catch(() => {});

  return NextResponse.redirect(`${appUrl}/admin/mail/config?success=connected`);
}
