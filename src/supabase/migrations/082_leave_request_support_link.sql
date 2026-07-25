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

-- 082_leave_request_support_link.sql

-- 1. Add tracking columns to leave_requests
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS support_ticket_id UUID REFERENCES support_tickets(id) ON DELETE SET NULL;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 2. Create trigger to auto-approve leave when ticket is resolved
CREATE OR REPLACE FUNCTION trg_approve_leave_on_ticket_resolve()
RETURNS TRIGGER AS $$
BEGIN
  -- If ticket was just resolved or closed
  IF NEW.status IN ('resolved', 'closed') AND NEW.category = 'Leave Extension' AND OLD.status NOT IN ('resolved', 'closed') THEN
    UPDATE leave_requests
    SET status = 'Approved',
        approved_by = NEW.resolved_by,
        approved_at = NEW.resolved_at
    WHERE support_ticket_id = NEW.id AND status = 'Pending';
  
  -- If ticket was rejected
  ELSIF NEW.status = 'rejected' AND NEW.category = 'Leave Extension' AND OLD.status != 'rejected' THEN
    UPDATE leave_requests
    SET status = 'Rejected',
        approved_by = NEW.resolved_by,
        approved_at = NEW.resolved_at
    WHERE support_ticket_id = NEW.id AND status = 'Pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approve_leave_on_ticket_resolve ON support_tickets;
CREATE TRIGGER approve_leave_on_ticket_resolve
  AFTER UPDATE OF status ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION trg_approve_leave_on_ticket_resolve();
