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
-- Migration 028: Meeting Minutes (MoM)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS meeting_minutes (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id      UUID        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  created_by      UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Raw transcript (pasted or auto-captured from Whisper)
  transcript      TEXT,

  -- AI-generated fields
  summary         TEXT,
  key_topics      JSONB       DEFAULT '[]',   -- string[]
  decisions       JSONB       DEFAULT '[]',   -- string[]
  action_items    JSONB       DEFAULT '[]',   -- { task, assignee_id, assignee_name, due_date, done }[]

  -- Meta
  status          TEXT        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','published')),
  analysis_model  TEXT        DEFAULT 'claude-3-5-sonnet-20240620',
  analyzed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (meeting_id)
);

CREATE INDEX IF NOT EXISTS mom_meeting_id ON meeting_minutes(meeting_id);
CREATE INDEX IF NOT EXISTS mom_status     ON meeting_minutes(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_mom_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_mom_updated_at ON meeting_minutes;
CREATE TRIGGER trg_mom_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW EXECUTE FUNCTION set_mom_updated_at();

-- RLS
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Participants and host can read
DROP POLICY IF EXISTS "mom_select" ON meeting_minutes;
CREATE POLICY "mom_select" ON meeting_minutes FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_minutes.meeting_id
    AND (
      m.host_id = auth.uid()
      OR EXISTS (SELECT 1 FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.employee_id = auth.uid())
      OR EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role IN ('super_admin','accounts'))
    )
  )
);

-- Host and admins can insert/update
DROP POLICY IF EXISTS "mom_insert" ON meeting_minutes;
CREATE POLICY "mom_insert" ON meeting_minutes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "mom_update" ON meeting_minutes;
CREATE POLICY "mom_update" ON meeting_minutes FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role IN ('super_admin','accounts'))
);

DROP POLICY IF EXISTS "mom_delete" ON meeting_minutes;
CREATE POLICY "mom_delete" ON meeting_minutes FOR DELETE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role IN ('super_admin','accounts'))
);

-- Realtime
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE meeting_minutes; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
