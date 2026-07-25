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
import { provisionZohoMailbox, generateTempPassword, checkMailboxLicense } from "@/lib/zoho-provisioning";

// Flip to `true` once Zoho is connected and licenses are configured.
// When false: skip the mailbox-license gate and skip auto-provisioning a mailbox.
const ZOHO_ONBOARDING_ENABLED = false;

export async function GET() {
  const supabase = getSupabaseAdmin();
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_id, name, email, zoho_email, department, designation, matrix_role, team_id, role, joining_date, is_active, status, monthly_leave_quota, leave_balance, teams:team_id(name)")
      .order("name");
    if (error) throw error;
    return NextResponse.json({ employees: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const body = await req.json();
    const {
      name, email, role, department, team_id, designation,
      joining_date, employment_type, salary_structure, base_salary,
      monthly_leave_quota, created_by,
    } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "name, email, and role are required." }, { status: 400 });
    }

    // ── 0. License gate (Zoho onboarding) ──────────────────────────────────────
    // Skipped while ZOHO_ONBOARDING_ENABLED is false.
    if (ZOHO_ONBOARDING_ENABLED) {
      const license = await checkMailboxLicense();
      if (!license.canCreate) {
        return NextResponse.json({
          error: `No Zoho mailbox licenses available (${license.used ?? "?"}/${license.allowed ?? "?"} seats used). Add seats in Zoho before onboarding a new employee.`,
          license,
        }, { status: 402 });
      }
    }

    // Build professional email address: firstname.lastname@domain
    const parts        = name.trim().toLowerCase().split(/\s+/);
    const localPart    = parts.length >= 2
      ? `${parts[0]}.${parts[parts.length - 1]}`
      : parts[0];
    
    // Prefer env var, then default to mail.namaah.io, then dynamically query configuration
    let mailDomain = process.env.ZOHO_MAIL_DOMAIN || "mail.namaah.io";
    const { data: orgCfg } = await supabase.from("zoho_config").select("org_domain").maybeSingle();
    if (orgCfg?.org_domain) {
      mailDomain = orgCfg.org_domain;
    }
    const professionalEmail = `${localPart}@${mailDomain}`;

    // ── 1. Generate employee_id ───────────────────────────────────────────────
    const prefix  = role === "intern" ? "IN" : "NP";
    const { count } = await supabase.from("employees").select("*", { count: "exact", head: true });
    const nextNum = String((count || 0) + 1).padStart(4, "0");
    const employee_id = `${prefix}-${nextNum}`;

    // ── 2. Create Supabase Auth user ──────────────────────────────────────────
    const tempPassword = generateTempPassword();
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email:          professionalEmail,
      password:       tempPassword,
      email_confirm:  true,
    });

    if (authError && !authError.message.includes("already been registered")) {
      return NextResponse.json({ error: `Auth creation failed: ${authError.message}` }, { status: 400 });
    }

    const userId = authUser?.user?.id;

    // ── 3. Insert employee record ─────────────────────────────────────────────
    const { data: emp, error: empError } = await supabase
      .from("employees")
      .insert({
        ...(userId ? { id: userId } : {}),
        name,
        email:               professionalEmail,
        personal_email:      email,
        zoho_email:          professionalEmail,
        employee_id,
        role,
        department:          department || null,
        team_id:             team_id    || null,
        designation:         designation || null,
        joining_date:        joining_date || new Date().toISOString().split("T")[0],
        employment_type:     employment_type || (role === "intern" ? "internship" : "full_time"),
        salary_structure:    salary_structure || (role === "intern" ? "stipend" : "fixed_monthly"),
        base_salary:         base_salary || 0,
        monthly_leave_quota: monthly_leave_quota || (role === "intern" ? 1 : 1.5),
        leave_balance:       monthly_leave_quota || (role === "intern" ? 1 : 1.5),
        is_active:           true,
        status:              "active",
      })
      .select()
      .single();

    if (empError) throw empError;

    // ── 4. Auto-provision Zoho mailbox ────────────────────────────────────────
    // Skipped while ZOHO_ONBOARDING_ENABLED is false.
    let zohoResult: any = null;
    if (ZOHO_ONBOARDING_ENABLED) {
      try {
        zohoResult = await provisionZohoMailbox({
          employeeId:  emp.id,
          name,
          designation: designation || "",
          department:  department  || "",
          tempPassword,
        });
      } catch (zohoErr: any) {
        console.error("[Zoho provision] non-fatal:", zohoErr.message);
      }
    }

    // ── 5. Audit log ──────────────────────────────────────────────────────────
    await supabase.from("audit_logs").insert({
      user_id:     created_by || null,
      action:      "employee_created",
      target_type: "employee",
      target_id:   emp.id,
      metadata:    { name, email, role, zoho_email: zohoResult?.zoho_email },
    });

    return NextResponse.json({
      employee:    emp,
      zoho_email:  zohoResult?.zoho_email || null,
      temp_password: tempPassword,
      message: "Employee created. Welcome email should be sent with temp credentials.",
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
