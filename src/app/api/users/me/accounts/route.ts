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

// GET /api/users/me/accounts?userId=
// Returns all Zoho accounts the user can access (own + shared)
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const userId   = req.nextUrl.searchParams.get("userId");

    if (!userId) return NextResponse.json({ accounts: [] });

    // Get user's own zoho account + any shared access
    const [{ data: emp }, { data: shared }] = await Promise.all([
      supabase
        .from("employees")
        .select("zoho_email, zoho_account_id, name, role, department")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("account_access")
        .select("zoho_account_id, email_address, display_name, access_type")
        .eq("user_id", userId),
    ]);

    const accounts: any[] = [];

    // Personal mailbox
    if (emp?.zoho_email && emp?.zoho_account_id) {
      accounts.push({
        zoho_account_id: emp.zoho_account_id,
        email_address:   emp.zoho_email,
        display_name:    emp.name,
        access_type:     "owner",
        is_personal:     true,
      });
    }

    // Shared mailboxes from account_access
    for (const row of shared || []) {
      if (row.zoho_account_id !== emp?.zoho_account_id) {
        accounts.push({ ...row, is_personal: false });
      }
    }

    // Add standard shared mailboxes based on role
    const sharedMailboxes = getSharedMailboxesForRole(emp?.role || "", emp?.department || "");
    for (const sm of sharedMailboxes) {
      if (!accounts.find(a => a.email_address === sm.email_address)) {
        accounts.push(sm);
      }
    }

    return NextResponse.json({ accounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getSharedMailboxesForRole(role: string, department: string) {
  const domain   = process.env.ZOHO_MAIL_DOMAIN || "namaah.in";
  const mailboxes: any[] = [];

  if (role === "admin") {
    mailboxes.push(
      { email_address: `accounts@${domain}`, display_name: "Accounts Team", access_type: "shared_send", is_personal: false },
      { email_address: `hr@${domain}`,       display_name: "HR Team",       access_type: "shared_send", is_personal: false },
      { email_address: `info@${domain}`,     display_name: "Info",          access_type: "shared_send", is_personal: false },
      { email_address: `noreply@${domain}`,  display_name: "No Reply",      access_type: "shared_read", is_personal: false },
      { email_address: `support@${domain}`,  display_name: "Support",       access_type: "shared_send", is_personal: false },
      { email_address: `invoices@${domain}`, display_name: "Invoices",      access_type: "shared_send", is_personal: false },
    );
  } else if (role === "accounts") {
    mailboxes.push({ email_address: `accounts@${domain}`, display_name: "Accounts Team", access_type: "shared_send", is_personal: false });
    mailboxes.push({ email_address: `invoices@${domain}`, display_name: "Invoices",      access_type: "shared_send", is_personal: false });
  } else if (role === "hr") {
    mailboxes.push({ email_address: `hr@${domain}`,      display_name: "HR Team",       access_type: "shared_send", is_personal: false });
    const deptLower = department.toLowerCase();
    if (deptLower.includes("support")) {
      mailboxes.push({ email_address: `support@${domain}`, display_name: "Support",       access_type: "shared_send", is_personal: false });
    }
  }

  return mailboxes;
}
