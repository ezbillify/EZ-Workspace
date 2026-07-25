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

-- ============================================================================
-- 092: Sales Commission Role & Salary Slab System
-- Adds: target_based employment type, salary_slabs table,
--       commission columns on employees
-- ============================================================================

-- 1. Extend employment_type enum with target_based
ALTER TYPE employment_type ADD VALUE IF NOT EXISTS 'target_based';

-- 2. salary_slabs — admin-controlled commission tier templates
CREATE TABLE IF NOT EXISTS salary_slabs (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT          NOT NULL,
  min_target         NUMERIC(15,2) NOT NULL DEFAULT 0,     -- sales amount floor (₹)
  max_target         NUMERIC(15,2),                        -- NULL = unlimited
  commission_percent NUMERIC(5,2)  NOT NULL CHECK (commission_percent > 0),
  is_active          BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order         INT           NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_slabs_active
  ON salary_slabs(is_active, sort_order);

ALTER TABLE salary_slabs ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "slabs_admin_all" ON salary_slabs
  USING     (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- All authenticated: read active slabs (for employee form dropdown)
CREATE POLICY "slabs_authenticated_read" ON salary_slabs
  FOR SELECT
  USING (is_active = TRUE OR get_my_role() = 'admin');

-- 3. Extend employees table with sales/commission columns
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS commission_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS monthly_sales_target NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS salary_slab_id       UUID         REFERENCES salary_slabs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_commission
  ON employees(commission_enabled) WHERE commission_enabled = TRUE;

-- 4. Seed three starter slabs so the dropdown is not empty on first use
INSERT INTO salary_slabs (name, min_target, max_target, commission_percent, sort_order)
VALUES
  ('Starter (0 – 50k)',       0,      50000,  3,  1),
  ('Growth (50k – 1L)',   50001,  100000,  5,  2),
  ('Elite  (1L+)',        100001, NULL,    8,  3)
ON CONFLICT DO NOTHING;
