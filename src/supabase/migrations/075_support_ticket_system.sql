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

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 075: Hierarchical Support Ticket System
--
-- FLOW:
--   Any employee raises a ticket → selects target role → selects specific employee
--   Targeted employee sees ticket in their "Solve" queue → resolves → response sent back
--   Super Admin sees ALL tickets across organization in Support Command Center
--   Real-time updates via Supabase Realtime
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Enums ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. support_tickets ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who raised it
  creator_id       UUID           NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Where it's going
  target_role      TEXT           NOT NULL,
  assignee_id      UUID           NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Ticket details
  subject          TEXT           NOT NULL,
  description      TEXT           NOT NULL DEFAULT '',
  category         TEXT           NOT NULL DEFAULT 'General',
  priority         ticket_priority NOT NULL DEFAULT 'medium',
  status           ticket_status  NOT NULL DEFAULT 'open',

  -- Resolution
  resolution_notes TEXT,
  resolved_by      UUID           REFERENCES employees(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,

  -- Timestamps
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tickets_creator    ON support_tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee   ON support_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status     ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_target     ON support_tickets(target_role);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON support_tickets(created_at DESC);

-- ─── 3. ticket_responses (conversation thread) ─────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_responses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  message     TEXT        NOT NULL,
  is_internal BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_ticket ON ticket_responses(ticket_id, created_at);

-- ─── 4. RLS Policies ─────────────────────────────────────────────────────────
ALTER TABLE support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_responses  ENABLE ROW LEVEL SECURITY;

-- Tickets: Users can see tickets they created OR are assigned to
-- Super Admin / HR can see all
DROP POLICY IF EXISTS "tickets_select" ON support_tickets;
CREATE POLICY "tickets_select" ON support_tickets FOR SELECT TO authenticated USING (
  creator_id = auth.uid()
  OR assignee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = auth.uid()
      AND e.role IN ('super_admin', 'hr')
  )
);

DROP POLICY IF EXISTS "tickets_insert" ON support_tickets;
CREATE POLICY "tickets_insert" ON support_tickets FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "tickets_update" ON support_tickets;
CREATE POLICY "tickets_update" ON support_tickets FOR UPDATE TO authenticated USING (
  creator_id = auth.uid()
  OR assignee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = auth.uid()
      AND e.role IN ('super_admin', 'hr')
  )
);

-- Responses: visible to ticket creator or assignee or admin
DROP POLICY IF EXISTS "responses_select" ON ticket_responses;
CREATE POLICY "responses_select" ON ticket_responses FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM support_tickets t
    WHERE t.id = ticket_responses.ticket_id
      AND (t.creator_id = auth.uid() OR t.assignee_id = auth.uid()
           OR EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role IN ('super_admin','hr')))
  )
);

DROP POLICY IF EXISTS "responses_insert" ON ticket_responses;
CREATE POLICY "responses_insert" ON ticket_responses FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- ─── 5. Realtime ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE ticket_responses;   EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ─── 6. Auto-update timestamp trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_updated_at ON support_tickets;
CREATE TRIGGER ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION trg_ticket_updated_at();

-- ─── 7. Register module keys in permission system ────────────────────────────
DO $$
DECLARE
  new_keys TEXT[] := ARRAY['support_admin', 'support_user'];
  all_roles TEXT[] := ARRAY['super_admin','hr','accounts','manager','lead','sales','employee','internship'];
  r TEXT;
  m TEXT;
BEGIN
  FOREACH r IN ARRAY all_roles LOOP
    FOREACH m IN ARRAY new_keys LOOP
      INSERT INTO role_permissions (role, module_key, can_view, can_create, can_edit, can_delete, can_export)
      VALUES (r, m, false, false, false, false, false)
      ON CONFLICT (role, module_key) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Super Admin: Full access to admin console + user hub
UPDATE role_permissions
SET can_view=true, can_create=true, can_edit=true, can_delete=true, can_export=true
WHERE role = 'super_admin' AND module_key IN ('support_admin', 'support_user');

-- HR: Full access to admin console + user hub
UPDATE role_permissions
SET can_view=true, can_create=true, can_edit=true, can_delete=false, can_export=true
WHERE role = 'hr' AND module_key IN ('support_admin', 'support_user');

-- All other roles: Access to user hub only (raise + solve their own)
UPDATE role_permissions
SET can_view=true, can_create=true, can_edit=true, can_delete=false, can_export=false
WHERE role IN ('accounts', 'manager', 'lead', 'sales', 'employee', 'internship')
  AND module_key = 'support_user';
