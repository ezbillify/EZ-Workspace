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
import { buildOAuthUrl } from "@/lib/zoho-mail";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { clientId, clientSecret, mailDomain, redirectUri } = await req.json();

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Client ID and Secret are required." }, { status: 400 });
  }

  const redirect = redirectUri || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mail/auth/callback`;

  // Check if a row already exists — always update it, never create duplicates
  const { data: existing } = await supabase
    .from("zoho_config")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("zoho_config").update({
      client_id:    clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      mail_domain:  mailDomain || process.env.ZOHO_MAIL_DOMAIN || "namaah.in",
      is_connected: false,
      updated_at:   new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("zoho_config").insert({
      client_id:    clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      mail_domain:  mailDomain || process.env.ZOHO_MAIL_DOMAIN || "namaah.in",
      is_connected: false,
    });
  }

  const authUrl = buildOAuthUrl(clientId, redirect);
  return NextResponse.json({ authUrl });
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("zoho_config")
    .select("is_connected, mail_domain, admin_account_id, connected_at, token_expiry, org_id")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ config: data });
}
