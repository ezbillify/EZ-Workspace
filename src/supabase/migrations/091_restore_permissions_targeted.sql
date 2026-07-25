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

-- Migration 091: Targeted Permission Restoration
-- Restores all modules to "Visible" for Admin except Manager and Employee dashboards.
-- Also restores standard access for other roles.

-- 1. Restore Admin: Everything ON except Manager Dashboard and Employee Dashboard
UPDATE role_permissions
SET can_view = true, can_create = true, can_edit = true, can_delete = true, can_export = true
WHERE role = 'admin';

UPDATE role_permissions
SET can_view = false, can_create = false, can_edit = false, can_delete = false, can_export = false
WHERE role = 'admin' AND module_key IN ('manager_dashboard', 'my_dashboard');

-- 2. Restore Department Lead (formerly 'manager')
UPDATE role_permissions
SET can_view = true, can_create = true, can_edit = true, can_delete = false, can_export = false
WHERE role = 'dept_lead' AND module_key IN (
  'manager_dashboard', 'projects', 'manager_teams', 'manager_org_chart',
  'job_clusters', 'recruitment', 'ats_scanner', 'kpi_kra', 'lms_academy',
  'workspace_hub', 'workspace_documents', 'workspace_spreadsheets',
  'workspace_presentations', 'workspace_notes',
  'mail_inbox', 'mail_compose', 'mail_sent', 'mail_files',
  'my_profile', 'my_attendance', 'my_incentives', 'my_payslips',
  'my_messages', 'my_meetings'
);

-- 3. Restore Team Lead (formerly 'lead')
UPDATE role_permissions
SET can_view = true, can_create = true, can_edit = false, can_delete = false, can_export = false
WHERE role = 'team_lead' AND module_key IN (
  'projects', 'kpi_kra', 'recruitment', 'ats_scanner',
  'attendance', 'budgets', 'subscriptions',
  'workspace_hub', 'workspace_documents', 'workspace_spreadsheets',
  'workspace_presentations', 'workspace_notes',
  'mail_hub', 'mail_inbox', 'mail_compose', 'mail_sent', 'mail_files',
  'messages', 'meetings'
);

-- 4. Restore Employee
UPDATE role_permissions
SET can_view = true, can_create = true, can_edit = true, can_delete = false, can_export = false
WHERE role = 'employee' AND module_key IN (
  'my_dashboard', 'my_profile', 'my_attendance', 'my_performance',
  'my_incentives', 'my_payslips', 'my_reimbursements', 'my_priority_payout',
  'training_academy',
  'workspace_hub', 'workspace_documents', 'workspace_spreadsheets',
  'workspace_presentations', 'workspace_notes',
  'mail_inbox', 'mail_compose', 'mail_sent', 'mail_drafts',
  'my_messages', 'my_meetings'
);

-- 5. Restore Intern
UPDATE role_permissions
SET can_view = true, can_create = false, can_edit = false, can_delete = false, can_export = false
WHERE role = 'intern' AND module_key IN (
  'my_dashboard', 'training_academy', 'my_profile', 'my_attendance',
  'workspace_hub', 'workspace_documents', 'workspace_notes',
  'mail_inbox', 'mail_compose', 'mail_sent',
  'my_messages', 'my_meetings'
);
