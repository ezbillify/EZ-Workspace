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
-- 00000004_intern_settings_and_lop.sql
--
-- Adds:
--   1. intern_module_settings — single-row table for module-wide settings.
--   2. Computed LOP logic — extra_leave_days > 0 reduces gross.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

-- ─── 1. Module settings (singleton row) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.intern_module_settings (
  id                          INT PRIMARY KEY DEFAULT 1,
  default_holidays_per_month  INT NOT NULL DEFAULT 6 CHECK (default_holidays_per_month >= 0),
  -- The divisor used for per-day rate (stipend / divisor). Currently 30.
  -- Locked here but configurable for forward-compat in case policy changes.
  per_day_divisor             INT NOT NULL DEFAULT 30 CHECK (per_day_divisor > 0),
  -- When enabled, Generate Cycles auto-creates the buffer-month cycle for
  -- interns whose starting_date precedes their billing_date.
  auto_buffer_cycle           BOOLEAN NOT NULL DEFAULT true,
  -- Free-form internal notes shown on the settings page.
  notes                       TEXT,
  updated_by                  UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce singleton: only id = 1 is allowed.
  CONSTRAINT intern_module_settings_singleton CHECK (id = 1)
);

-- Seed the row if missing
INSERT INTO public.intern_module_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.intern_module_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "intern_settings_admin_accounts_all" ON public.intern_module_settings;
CREATE POLICY "intern_settings_admin_accounts_all"
ON public.intern_module_settings FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role IN ('admin', 'accounts') AND is_active = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role IN ('admin', 'accounts') AND is_active = true)
);
