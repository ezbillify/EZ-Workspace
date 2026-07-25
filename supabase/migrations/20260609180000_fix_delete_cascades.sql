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

-- Migration: Fix Delete Cascades for employees table
-- Updates foreign keys referencing employees(id) that block deletion to use ON DELETE CASCADE or ON DELETE SET NULL.

-- audit_logs (actor_id)
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES employees(id) ON DELETE SET NULL;

-- kpi_history (employee_id, changed_by)
ALTER TABLE kpi_history DROP CONSTRAINT IF EXISTS kpi_history_employee_id_fkey;
ALTER TABLE kpi_history ADD CONSTRAINT kpi_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE kpi_history DROP CONSTRAINT IF EXISTS kpi_history_changed_by_fkey;
ALTER TABLE kpi_history ADD CONSTRAINT kpi_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL;

-- kpi_metrics (entered_by)
ALTER TABLE kpi_metrics DROP CONSTRAINT IF EXISTS kpi_metrics_entered_by_fkey;
ALTER TABLE kpi_metrics ADD CONSTRAINT kpi_metrics_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES employees(id) ON DELETE SET NULL;

-- lms_announcements (created_by)
ALTER TABLE lms_announcements DROP CONSTRAINT IF EXISTS lms_announcements_created_by_fkey;
ALTER TABLE lms_announcements ADD CONSTRAINT lms_announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;

-- lms_employee_badges (awarded_by)
ALTER TABLE lms_employee_badges DROP CONSTRAINT IF EXISTS lms_employee_badges_awarded_by_fkey;
ALTER TABLE lms_employee_badges ADD CONSTRAINT lms_employee_badges_awarded_by_fkey FOREIGN KEY (awarded_by) REFERENCES employees(id) ON DELETE SET NULL;

-- attendance_settings (updated_by)
ALTER TABLE attendance_settings DROP CONSTRAINT IF EXISTS attendance_settings_updated_by_fkey;
ALTER TABLE attendance_settings ADD CONSTRAINT attendance_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL;

-- calendar_events (created_by)
ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_created_by_fkey;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;

-- sales_records (entered_by)
ALTER TABLE sales_records DROP CONSTRAINT IF EXISTS sales_records_entered_by_fkey;
ALTER TABLE sales_records ADD CONSTRAINT sales_records_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES employees(id) ON DELETE SET NULL;

-- incentive_grants (awarded_by)
ALTER TABLE incentive_grants DROP CONSTRAINT IF EXISTS incentive_grants_awarded_by_fkey;
ALTER TABLE incentive_grants ADD CONSTRAINT incentive_grants_awarded_by_fkey FOREIGN KEY (awarded_by) REFERENCES employees(id) ON DELETE SET NULL;

-- payslips (generated_by, approved_by)
ALTER TABLE payslips DROP CONSTRAINT IF EXISTS payslips_generated_by_fkey;
ALTER TABLE payslips ADD CONSTRAINT payslips_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE payslips DROP CONSTRAINT IF EXISTS payslips_approved_by_fkey;
ALTER TABLE payslips ADD CONSTRAINT payslips_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES employees(id) ON DELETE SET NULL;
