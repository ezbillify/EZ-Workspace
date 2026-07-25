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

// Checks whether an email already exists anywhere in the system:
// employees table (email / personal_email / zoho_email) OR
// active onboarding packets OR candidate document requests.
// Used by Add Personnel form to block duplicates before submission.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ exists: false });

  const supabase = getSupabaseAdmin();

  // Only block on active employees and active (non-completed/rejected) onboarding packets.
  // Deleted employees free up their email — historical candidate records are not blocking.
  const [{ data: inEmployees }, { data: inOnboarding }] = await Promise.all([
    supabase
      .from("employees")
      .select("name, email, role")
      .or(`email.ilike.${email},personal_email.ilike.${email},zoho_email.ilike.${email}`)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("onboarding_packets")
      .select("candidate_name, status")
      .ilike("candidate_email", email)
      .not("status", "in", '("completed","rejected")')
      .limit(1)
      .maybeSingle(),
  ]);

  if (inEmployees) {
    return NextResponse.json({
      exists: true,
      type: "employee",
      message: `"${inEmployees.name}" is already an employee with this email. Cannot create a duplicate.`,
    });
  }

  if (inOnboarding) {
    return NextResponse.json({
      exists: true,
      type: "onboarding",
      message: `"${inOnboarding.candidate_name}" has an active onboarding in progress (${inOnboarding.status}). Complete or cancel it before adding as an employee.`,
    });
  }

  return NextResponse.json({ exists: false });
}
