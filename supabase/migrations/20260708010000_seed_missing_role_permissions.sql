-- Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
-- Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
-- 
-- WARNING & LIABILITY DISCLAIMER:
-- THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
-- AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
-- IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
-- DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
-- FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
-- DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
-- SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
-- CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
-- OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
-- OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
-- 
-- IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
-- UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
-- ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.

-- 115: Complete the permission map — seed every missing (role × module) row.
-- Audit found gaps across the 7 roles × the full module catalog. Notably
-- `audit_log` and `payroll_internship` had ZERO rows for ANY role, so even admin
-- couldn't see the Audit Log / Internship Stipend pages in the sidebar.
--
-- This fills ONLY the gaps (ON CONFLICT DO NOTHING) — existing rows are never
-- touched. Admin gets full access to any newly-seeded module; every other role
-- gets can_view = false (stays hidden), so NO existing visibility changes. This
-- makes the map explicit for every module — the prerequisite for safely enforcing
-- the direct-URL route guard.

-- Lead roles keep access to the Team-Lead dashboard page (moduleKey lead_dashboard,
-- which had no rows at all). Seeded explicitly = true for the lead roles first, so
-- the generative fill below leaves them true.
insert into role_permissions (role, module_key, can_view, can_create, can_edit, can_delete, can_export)
values
  ('team_lead', 'lead_dashboard', true, false, false, false, false),
  ('dept_lead', 'lead_dashboard', true, false, false, false, false)
on conflict (role, module_key) do nothing;

-- Fill every remaining (role × module) gap. Admin = full access, others = hidden.
insert into role_permissions (role, module_key, can_view, can_create, can_edit, can_delete, can_export)
select r.role,
       m.module_key,
       (r.role = 'admin'),
       (r.role = 'admin'),
       (r.role = 'admin'),
       (r.role = 'admin'),
       (r.role = 'admin')
from (values ('admin'),('hr'),('accounts'),('employee'),('intern'),('dept_lead'),('team_lead')) as r(role)
cross join (values
  ('accounts_dashboard'),('admin_dashboard'),('analytics'),('ats_scanner'),('attendance'),
  ('audit_log'),('budgets'),('claims'),('crm_clients'),('employees'),
  ('feature_report'),('hr_dashboard'),('incentives'),('interviews'),('invoicing'),
  ('job_clusters'),('kpi_kra'),('lead_dashboard'),('lms_academy'),('lms_certifications'),
  ('lms_courses'),('mail_accounts'),('mail_compose'),('mail_config'),('mail_drafts'),
  ('mail_files'),('mail_hub'),('mail_inbox'),('mail_sent'),('mail_templates'),
  ('manager_dashboard'),('manager_org_chart'),('manager_teams'),('master_log'),('meetings'),
  ('messages'),('my_academy'),('my_attendance'),('my_calendar'),('my_dashboard'),
  ('my_incentives'),('my_meetings'),('my_messages'),('my_payslips'),('my_performance'),
  ('my_priority_payout'),('my_profile'),('my_projects'),('my_reimbursements'),('onboarding'),
  ('onboarding_builder'),('onboarding_manual'),('org_chart'),('payroll'),('payroll_internship'),
  ('payslips_management'),('permissions_control'),('priority_payout'),('projects'),('recruitment'),
  ('reimbursements'),('sales_pipeline'),('security_audit'),('sessions'),('shift_management'),
  ('subscriptions'),('support_admin'),('support_user'),('system_config'),('teams'),
  ('training_academy'),('vendors'),('workspace_documents'),('workspace_hub'),('workspace_monitor'),
  ('workspace_notes'),('workspace_presentations'),('workspace_spreadsheets')
) as m(module_key)
on conflict (role, module_key) do nothing;
