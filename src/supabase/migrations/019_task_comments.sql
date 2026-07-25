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

-- Migration 019: Task Comments + Custom Column Support
-- Removes hard status constraint (allows custom kanban columns)
-- Adds task_comments table for per-task discussion threads

-- ─── 1. Remove hard status check so custom columns can be persisted ──────────
ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_status_check;

-- ─── 2. task_comments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID        NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  author_name  TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tc_select" ON task_comments;
DROP POLICY IF EXISTS "tc_insert" ON task_comments;
DROP POLICY IF EXISTS "tc_delete" ON task_comments;
CREATE POLICY "tc_select" ON task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "tc_insert" ON task_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tc_delete" ON task_comments FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
