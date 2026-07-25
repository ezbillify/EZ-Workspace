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
-- ADD KPI FIELDS TO EMPLOYEES TABLE
-- ============================================================

-- Add KPI-related columns to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS current_kpi_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_kra_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_behavioral_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_final_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_rating TEXT DEFAULT 'Meets',
  ADD COLUMN IF NOT EXISTS ytd_average NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_trend TEXT DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining')),
  ADD COLUMN IF NOT EXISTS last_kpi_update TIMESTAMPTZ;

-- Trigger to auto-update employee KPI fields from kpi_metrics
CREATE OR REPLACE FUNCTION sync_employee_kpi()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.employees
  SET
    current_kpi_score = NEW.kpi_score,
    current_kra_score = NEW.kra_score,
    current_behavioral_score = NEW.behavioral_score,
    current_final_score = NEW.final_score,
    current_rating = NEW.rating_label,
    last_kpi_update = NOW()
  WHERE id = NEW.employee_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_employee_kpi_trigger ON public.kpi_metrics;
CREATE TRIGGER sync_employee_kpi_trigger
AFTER INSERT OR UPDATE ON public.kpi_metrics
FOR EACH ROW
EXECUTE FUNCTION sync_employee_kpi();

-- Grant permissions
GRANT ALL ON public.employees TO authenticated;

-- Refresh schema
NOTIFY pgrst, 'reload schema';
