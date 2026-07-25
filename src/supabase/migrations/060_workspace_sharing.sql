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

-- ─── Workspace Sharing & UI Enhancements ───────────────────────────────────
-- Adds support for collaborative sharing and premium document UI features.

-- 1. Add cover image support to documents
ALTER TABLE workspace_documents ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT NULL;

-- 2. Create Workspace Shares table for robust permission management
-- This replaces the JSONB 'shared_with' field for better relational queries.
CREATE TABLE IF NOT EXISTS workspace_shares (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        UUID NOT NULL, -- References doc, sheet, etc.
  item_type      TEXT NOT NULL CHECK (item_type IN ('document', 'spreadsheet', 'presentation', 'note')),
  user_id        UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  access_level   TEXT NOT NULL CHECK (access_level IN ('read', 'edit')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, user_id)
);

-- 3. Indexes for sharing performance
CREATE INDEX IF NOT EXISTS idx_workspace_shares_item ON workspace_shares(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_workspace_shares_user ON workspace_shares(user_id);

-- 4. Activity log additions
-- (Already exists in 059_workspace.sql, just ensuring it's used)

-- 5. RLS Policies for sharing
ALTER TABLE workspace_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_shares_all" ON workspace_shares FOR ALL USING (true) WITH CHECK (true);

-- 6. View for easier sharing management
CREATE OR REPLACE VIEW workspace_shared_users AS
SELECT 
  ws.id as share_id,
  ws.item_id,
  ws.item_type,
  ws.access_level,
  e.id as user_id,
  e.name,
  e.email,
  e.role,
  e.employee_id
FROM workspace_shares ws
JOIN employees e ON ws.user_id = e.id;
