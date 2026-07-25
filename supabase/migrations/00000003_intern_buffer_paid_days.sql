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
-- 00000003_intern_buffer_paid_days.sql
--
-- Adds `buffer_paid_days` to intern_stipend_cycles.
--
-- Default 0 (informational only — buffer days are unpaid).
-- Admin can override per-cycle to credit buffer days as paid (typically only
-- on the first cycle of an intern). Gross then becomes:
--   gross = (stipend / 30) × (paid_days + buffer_paid_days)
--
-- Idempotent. Safe to re-run.
-- ============================================================================

ALTER TABLE public.intern_stipend_cycles
  ADD COLUMN IF NOT EXISTS buffer_paid_days INT NOT NULL DEFAULT 0
    CHECK (buffer_paid_days >= 0);

-- Refresh view to include the new column
DROP VIEW IF EXISTS public.intern_stipend_cycles_view;
CREATE VIEW public.intern_stipend_cycles_view AS
SELECT
  c.id,
  c.intern_id,
  i.full_name,
  i.intern_id        AS intern_code,
  i.upi_id,
  i.stipend_amount,
  i.joining_date,
  i.starting_date,
  i.billing_date,
  i.is_active        AS intern_is_active,
  c.month,
  c.year,
  c.paid_days,
  c.buffer_paid_days,
  c.holidays_taken,
  c.extra_leave_days,
  c.gross_amount,
  c.deductions,
  c.net_amount,
  c.payment_status,
  c.payment_date,
  c.payment_ref,
  c.paid_by,
  c.notes,
  c.created_at,
  c.updated_at
FROM public.intern_stipend_cycles c
JOIN public.interns i ON i.id = c.intern_id;
