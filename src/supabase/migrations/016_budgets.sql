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
-- Migration 016: Budgets & Allocations
-- Creates: budgets, budget_allocations with auto-numbering, RLS, realtime
-- Cross-links to: purchases (filed_by_dept), subscriptions (via allocations)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Budgets table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_number      TEXT          NOT NULL UNIQUE,
  name               TEXT          NOT NULL,
  scope_type         TEXT          NOT NULL DEFAULT 'department'
                                   CHECK (scope_type IN ('department','team','company')),
  department_name    TEXT,
  team_id            UUID          REFERENCES teams(id) ON DELETE SET NULL,
  fiscal_year        INT           NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  fiscal_month       INT           CHECK (fiscal_month BETWEEN 1 AND 12),  -- NULL = full year
  total_amount       NUMERIC(15,2) NOT NULL DEFAULT 0,
  category           TEXT          NOT NULL DEFAULT 'General',
  notes              TEXT,
  status             TEXT          NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active','closed','draft')),
  created_by_name    TEXT,
  created_by_emp_id  TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 2. Budget Allocations table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_allocations (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id       UUID          NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category        TEXT          NOT NULL,
  label           TEXT,
  allocated       NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- optional link to a subscription for cost tracking
  linked_sub_id   UUID          REFERENCES subscriptions(id) ON DELETE SET NULL,
  sort_order      INT           DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── 3. Auto-generate budget_number ──────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS budget_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_budget_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.budget_number IS NULL OR NEW.budget_number = '' THEN
    NEW.budget_number := 'BUD-' || LPAD(nextval('budget_number_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_budget_number ON budgets;
CREATE TRIGGER set_budget_number
  BEFORE INSERT ON budgets
  FOR EACH ROW EXECUTE FUNCTION generate_budget_number();

-- ─── 4. Auto-update updated_at ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS budgets_updated_at ON budgets;
CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_budgets_updated_at();

-- ─── 5. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE budgets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select" ON budgets;
DROP POLICY IF EXISTS "budgets_insert" ON budgets;
DROP POLICY IF EXISTS "budgets_update" ON budgets;
DROP POLICY IF EXISTS "budgets_delete" ON budgets;
CREATE POLICY "budgets_select" ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "budgets_delete" ON budgets FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "alloc_select" ON budget_allocations;
DROP POLICY IF EXISTS "alloc_insert" ON budget_allocations;
DROP POLICY IF EXISTS "alloc_update" ON budget_allocations;
DROP POLICY IF EXISTS "alloc_delete" ON budget_allocations;
CREATE POLICY "alloc_select" ON budget_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "alloc_insert" ON budget_allocations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "alloc_update" ON budget_allocations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "alloc_delete" ON budget_allocations FOR DELETE TO authenticated USING (true);

-- ─── 6. Realtime publication ──────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_allocations;
