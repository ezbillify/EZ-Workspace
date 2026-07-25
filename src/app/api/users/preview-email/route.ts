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

// Returns the actual email that will be assigned when creating an employee with the given name.
// Applies the same dedup logic as POST /api/users so the form preview is accurate.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ email: "" });

  const supabase = getSupabaseAdmin();

  let mailDomain = process.env.ZOHO_MAIL_DOMAIN || "mail.namaah.io";
  const { data: orgCfg } = await supabase.from("zoho_config").select("org_domain").maybeSingle();
  if (orgCfg?.org_domain) mailDomain = orgCfg.org_domain;

  const parts     = name.toLowerCase().split(/\s+/);
  const baseLocal = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];

  let localPart = baseLocal;
  let isDuplicate = false;
  let attempt = 0;

  while (true) {
    const candidate = `${localPart}@${mailDomain}`;
    const { data: existing } = await supabase
      .from("employees")
      .select("id")
      .or(`email.ilike.${candidate},zoho_email.ilike.${candidate}`)
      .maybeSingle();
    if (!existing) break;
    isDuplicate = true;
    // Use a deterministic-looking suffix for the preview (actual creation uses random)
    const suffix = 1000 + (name.length * 317 + attempt * 97) % 9000;
    localPart = `${baseLocal}${suffix}`;
    attempt++;
    if (attempt > 10) break;
  }

  return NextResponse.json({
    email: `${localPart}@${mailDomain}`,
    isDuplicate,
  });
}
