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
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateSSOKeyPair } from "@/lib/saml";

export async function GET() {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: config } = await supabase
    .from("zoho_config")
    .select("id, saml_enabled, saml_issuer, saml_acs_url, saml_certificate, zoid")
    .maybeSingle();

  if (!config) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({
    config: {
      saml_enabled: config.saml_enabled,
      saml_issuer: config.saml_issuer,
      saml_acs_url: config.saml_acs_url,
      saml_certificate: config.saml_certificate,
      zoid: config.zoid,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { saml_enabled, saml_issuer, saml_acs_url, regenerate_keys } = await req.json();

  const { data: config } = await supabase
    .from("zoho_config")
    .select("id, saml_private_key, saml_certificate, zoid")
    .maybeSingle();

  if (!config) {
    return NextResponse.json({ error: "Zoho is not configured. Connect Zoho Mail first." }, { status: 400 });
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (saml_enabled !== undefined) updates.saml_enabled = saml_enabled;
  if (saml_issuer !== undefined) updates.saml_issuer = saml_issuer;
  if (saml_acs_url !== undefined) updates.saml_acs_url = saml_acs_url;

  // Generate keys if explicitly requested or if they do not exist in the DB
  if (regenerate_keys || !config.saml_private_key || !config.saml_certificate) {
    try {
      const keys = await generateSSOKeyPair();
      updates.saml_private_key = keys.privateKey;
      updates.saml_certificate = keys.certificate;
    } catch (e: any) {
      console.error("[SAML Config] Failed to generate keys:", e);
      return NextResponse.json({ error: "Failed to generate SAML keypair: " + e.message }, { status: 500 });
    }
  }

  const { error } = await supabase
    .from("zoho_config")
    .update(updates)
    .eq("id", config.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch updated config to return
  const { data: updatedConfig } = await supabase
    .from("zoho_config")
    .select("id, saml_enabled, saml_issuer, saml_acs_url, saml_certificate, zoid")
    .eq("id", config.id)
    .single();

  return NextResponse.json({ success: true, config: updatedConfig });
}
