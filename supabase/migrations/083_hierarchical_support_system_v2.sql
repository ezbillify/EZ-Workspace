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
-- Migration 083: Hierarchical Support System V2
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Update Enum Values ──────────────────────────────────────────────────
-- In PostgreSQL, ALTER TYPE ADD VALUE cannot run inside a transaction block in some contexts,
-- so we run it directly. Supabase handles this automatically.
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'in_review';

-- ─── 2. Add New Columns to support_tickets ────────────────────────────────────
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_handler_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS tracking_log JSONB DEFAULT '[]'::jsonb;

-- ─── 3. Add Indexes for Performance ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_handler ON public.support_tickets(current_handler_id);

-- ─── 4. Comments for Documentation ──────────────────────────────────────────
COMMENT ON COLUMN public.support_tickets.attachments IS 'Array of file attachment URLs or paths raised with the ticket.';
COMMENT ON COLUMN public.support_tickets.current_handler_id IS 'The specific employee currently assigned to solve or route the ticket.';
COMMENT ON COLUMN public.support_tickets.rejection_reason IS 'Mandatory explanation logged if the ticket is rejected by any handler.';
COMMENT ON COLUMN public.support_tickets.tracking_log IS 'Chronological log containing the complete routing path and handler notes.';
