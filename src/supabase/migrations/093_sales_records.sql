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
-- 093: Sales Records — monthly achievement tracking per sales employee
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_records (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month        INT           NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         INT           NOT NULL CHECK (year >= 2020),
  amount_achieved NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  entered_by   UUID          REFERENCES employees(id),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_sales_records_employee ON sales_records(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_sales_records_period   ON sales_records(year, month);

ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;

-- Admin / leads: full read + write
CREATE POLICY "sales_records_lead_all" ON sales_records
  USING     (get_my_role() IN ('admin', 'dept_lead', 'team_lead'))
  WITH CHECK (get_my_role() IN ('admin', 'dept_lead', 'team_lead'));

-- Employee: read own records only
CREATE POLICY "sales_records_self_read" ON sales_records
  FOR SELECT
  USING (employee_id = auth.uid());
