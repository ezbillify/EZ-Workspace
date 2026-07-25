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

-- ─── Workspace Shares Table ──────────────────────────────────────────────────
-- Tracks which employees can access workspace items owned by others.
-- Each user only sees their own items + items shared with them.

CREATE TABLE IF NOT EXISTS workspace_shares (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type    TEXT NOT NULL CHECK (item_type IN ('document','spreadsheet','presentation','note')),
  item_id      UUID NOT NULL,
  item_title   TEXT,
  owner_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES employees(id) ON DELETE CASCADE,
  permission   TEXT DEFAULT 'view' CHECK (permission IN ('view','edit','comment')),
  message      TEXT DEFAULT '',
  shared_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (item_type, item_id, user_id)
);

-- View that joins shares with employee details (used by GET /api/workspace/shares)
CREATE OR REPLACE VIEW workspace_shared_users AS
  SELECT
    ws.id,
    ws.item_type,
    ws.item_id,
    ws.item_title,
    ws.permission,
    ws.message,
    ws.shared_at,
    e.id   AS user_id,
    e.name AS user_name,
    e.employee_id AS user_employee_id,
    e.role AS user_role
  FROM workspace_shares ws
  JOIN employees e ON e.id = ws.user_id;

CREATE INDEX IF NOT EXISTS idx_ws_shares_user  ON workspace_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_ws_shares_item  ON workspace_shares(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_ws_shares_owner ON workspace_shares(owner_id);

ALTER TABLE workspace_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_shares_all" ON workspace_shares FOR ALL USING (true) WITH CHECK (true);
