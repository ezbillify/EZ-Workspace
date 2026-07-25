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
-- 20260703000000_intern_amount_paid.sql
--
-- Adds `amount_paid` to intern_stipend_cycles: the amount ACTUALLY credited to
-- the intern for that month (vs net_amount = what is owed). This is what powers
-- the Interns Summary badges:
--   amount_paid = 0            -> Not Paid
--   0 < amount_paid < net      -> Half / Less Paid  (balance still due)
--   amount_paid = net          -> Paid
--   amount_paid > net          -> Over Paid          (excess)
--
-- Idempotent. Safe to re-run.
-- ============================================================================

ALTER TABLE public.intern_stipend_cycles
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (amount_paid >= 0);

-- Backfill: any cycle already marked paid is treated as fully paid.
UPDATE public.intern_stipend_cycles
   SET amount_paid = net_amount
 WHERE payment_status = 'paid' AND amount_paid = 0;
