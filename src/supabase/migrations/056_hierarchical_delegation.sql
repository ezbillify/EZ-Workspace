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

-- ============================================================
-- MIGRATION 056: HIERARCHICAL DELEGATION & AUDIT TRAIL
-- ============================================================

-- 1. Add audit columns to project_tasks
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES employees(id);
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add 'type' to project_tasks to distinguish Strategic (Lead level) vs Operational (Employee level)
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'operational' 
    CHECK (task_type IN ('strategic', 'operational'));

-- 3. Add parent_task_id for hierarchical breakdown (Lead can breakdown a Manager's task)
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE;

-- 4. Function to automatically update audit columns
CREATE OR REPLACE FUNCTION update_task_audit()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_task_audit
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_audit();

-- 5. Extend project_teams to store specific deliverables/scope from Manager
ALTER TABLE project_teams ADD COLUMN IF NOT EXISTS scope_description TEXT;
ALTER TABLE project_teams ADD COLUMN IF NOT EXISTS assigned_lead_id UUID REFERENCES employees(id);
