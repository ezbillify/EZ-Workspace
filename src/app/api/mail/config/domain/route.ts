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
import { getActiveToken } from "@/lib/zoho-mail";
import { syncDomainFromZoho } from "@/lib/zoho-provisioning";

const ZOHO_MAIL_API = process.env.ZOHO_MAIL_API_URL || "https://mail.zoho.in/api";

// ── GET: current domain + list of verified domains from Zoho ─────────────────
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: config } = await supabase
    .from("zoho_config")
    .select("id, org_id, zoid, org_domain, domain_synced_at")
    .maybeSingle();

  let orgId = config?.org_id || config?.zoid;
  if (!orgId && process.env.ZOHO_ORG_ID) {
    orgId = process.env.ZOHO_ORG_ID;
    if (config?.id) {
      await supabase
        .from("zoho_config")
        .update({ org_id: orgId, zoid: orgId })
        .eq("id", config.id);
    }
  }
  const token = await getActiveToken();

  // Try to fetch live domain list from Zoho
  let zohoDomains: { name: string; isPrimary: boolean; isVerified: boolean }[] = [];
  if (token && orgId) {
    try {
      const res  = await fetch(`${ZOHO_MAIL_API}/organization/${orgId}/domains`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` },
      });
      const json = await res.json();
      zohoDomains = (json?.data || []).map((d: any) => ({
        name:       d.domainName?.toLowerCase() || "",
        isPrimary:  d.isPrimary  || false,
        isVerified: d.isVerified || d.status === "verified" || false,
      }));
    } catch {
      // non-fatal — return what we have in DB
    }
  }

  return NextResponse.json({
    current_domain:  config?.org_domain || null,
    domain_synced_at: config?.domain_synced_at || null,
    zoho_domains:    zohoDomains,
    is_connected:    !!(token && orgId),
  });
}

// ── POST: manually set domain (overrides DB value) ────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { domain } = await req.json();

  if (!domain || !domain.includes(".")) {
    return NextResponse.json({ error: "Valid domain required (e.g. mail.namaah.io)" }, { status: 400 });
  }

  const clean = domain.trim().toLowerCase();

  const { data: config } = await supabase
    .from("zoho_config")
    .select("id, org_id, zoid")
    .maybeSingle();

  if (!config) {
    return NextResponse.json({ error: "Zoho not configured yet." }, { status: 400 });
  }

  let orgId = config.org_id || config.zoid;
  if (!orgId && process.env.ZOHO_ORG_ID) {
    orgId = process.env.ZOHO_ORG_ID;
    await supabase
      .from("zoho_config")
      .update({ org_id: orgId, zoid: orgId })
      .eq("id", config.id);
  }

  await supabase
    .from("zoho_config")
    .update({ org_domain: clean, domain_synced_at: new Date().toISOString() })
    .eq("id", config.id);

  return NextResponse.json({ success: true, domain: clean });
}

// ── PUT: sync domain FROM Zoho API (auto-detect) ─────────────────────────────
export async function PUT() {
  const domain = await syncDomainFromZoho();

  if (!domain) {
    return NextResponse.json(
      { error: "Could not sync domain from Zoho. Ensure Zoho is connected and org has a verified domain." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, domain });
}
