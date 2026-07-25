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
-- Migration 005: Analytics Backend
-- Adds: company_revenues, company_expenses, employee_ratings tables
--       health_score & actual_spent columns on projects
--       RLS policies, realtime publication
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Company Revenue Tracking (monthly) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_revenues (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  month      INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year       INTEGER     NOT NULL,
  amount     NUMERIC(20,2) NOT NULL DEFAULT 0,
  source     TEXT        NOT NULL DEFAULT 'operations',
  department TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (month, year, source)
);

-- ─── 2. Company Expense Tracking (monthly) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_expenses (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  month      INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year       INTEGER     NOT NULL,
  amount     NUMERIC(20,2) NOT NULL DEFAULT 0,
  category   TEXT        NOT NULL DEFAULT 'operations',
  department TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (month, year, category)
);

-- ─── 3. Project Enhancements ──────────────────────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS health_score NUMERIC(5,2) NOT NULL DEFAULT 75,
  ADD COLUMN IF NOT EXISTS actual_spent NUMERIC(20,2) NOT NULL DEFAULT 0;

-- ─── 4. Employee Ratings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_ratings (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  rating       NUMERIC(3,1) NOT NULL DEFAULT 3.5 CHECK (rating BETWEEN 1.0 AND 5.0),
  period_month INTEGER     NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year  INTEGER     NOT NULL,
  rated_by     UUID        REFERENCES employees(id) ON DELETE SET NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, period_month, period_year)
);

-- ──
─ 5. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE company_revenues  ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_expenses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_ratings  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_revenues_select" ON company_revenues;
DROP POLICY IF EXISTS "auth_revenues_insert" ON company_revenues;
DROP POLICY IF EXISTS "auth_revenues_update" ON company_revenues;
DROP POLICY IF EXISTS "auth_revenues_delete" ON company_revenues;
CREATE POLICY "auth_revenues_select" ON company_revenues FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_revenues_insert" ON company_revenues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_revenues_update" ON company_revenues FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_revenues_delete" ON company_revenues FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_expenses_select" ON company_expenses;
DROP POLICY IF EXISTS "auth_expenses_insert" ON company_expenses;
DROP POLICY IF EXISTS "auth_expenses_update" ON company_expenses;
DROP POLICY IF EXISTS "auth_expenses_delete" ON company_expenses;
CREATE POLICY "auth_expenses_select" ON company_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_expenses_insert" ON company_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_expenses_update" ON company_expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_expenses_delete" ON company_expenses FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_ratings_select" ON employee_ratings;
DROP POLICY IF EXISTS "auth_ratings_insert" ON employee_ratings;
DROP POLICY IF EXISTS "auth_ratings_update" ON employee_ratings;
CREATE POLICY "auth_ratings_select" ON employee_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_ratings_insert" ON employee_ratings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_ratings_update" ON employee_ratings FOR UPDATE TO authenticated USING (true);

-- ─── 6. Realtime Publication ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'company_revenues'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE company_revenues;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'company_expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE company_expenses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'employee_ratings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE employee_ratings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'kpi_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kpi_scores;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'incentives'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE incentives;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;
END $$;

