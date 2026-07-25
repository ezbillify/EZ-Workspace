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

// Only these personal email domains are accepted
const ALLOWED_DOMAINS = new Set([
  // Gmail
  "gmail.com",
  // Yahoo
  "yahoo.com", "yahoo.in", "yahoo.co.in", "yahoo.co.uk",
  // Zoho personal
  "zoho.com", "zoho.in",
  // Outlook / Microsoft
  "outlook.com", "outlook.in", "hotmail.com", "live.com",
  // EZ-Workspace company domains (used as the login identity when a Zoho mailbox
  // isn't auto-created — the person logs in with this until one is provisioned)
  "namaah.io", "namaah.in",
]);

// Common typo → correct domain
const TYPO_MAP: Record<string, string> = {
  "gmali.com": "gmail.com", "gmai.com": "gmail.com", "gmial.com": "gmail.com",
  "gmail.co": "gmail.com", "gmail.cm": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "outloo.com": "outlook.com", "outlok.com": "outlook.com",
};

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ valid: false, reason: "Invalid email format." });
  }

  const domain = email.split("@")[1];

  // Typo correction first
  if (TYPO_MAP[domain]) {
    const corrected = email.replace(`@${domain}`, `@${TYPO_MAP[domain]}`);
    return NextResponse.json({
      valid: false,
      reason: `Looks like a typo — did you mean ${corrected}?`,
      suggestion: corrected,
    });
  }

  // Domain allowlist check
  if (!ALLOWED_DOMAINS.has(domain)) {
    return NextResponse.json({
      valid: false,
      reason: `Only Gmail, Yahoo, Zoho, Outlook, or an EZ-Workspace (namaah.io / namaah.in) email is allowed. "${domain}" is not accepted.`,
    });
  }

  return NextResponse.json({ valid: true });
}
