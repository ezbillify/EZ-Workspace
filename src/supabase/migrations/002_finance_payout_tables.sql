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

-- src/supabase/migrations/002_finance_payout_tables.sql

-- Claims Table (Usually claims are requested by employees for particular tasks/bounties/incentives)
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  incentive_id UUID REFERENCES public.incentives(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, processed, paid, rejected
  cycle INT DEFAULT 1,
  queue_position INT DEFAULT 0,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reimbursements Table (Expenses incurred out of pocket)
CREATE TABLE IF NOT EXISTS public.reimbursements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  receipt_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, processed, paid, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Priority Payouts Table (Advances / emergency funds requested by employees)
CREATE TABLE IF NOT EXISTS public.priority_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  urgency VARCHAR(20) NOT NULL DEFAULT 'high', -- high, critical
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, processed, paid, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Run permissions mapping if needed for the UI, simplified
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read claims" ON public.claims FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert claims" ON public.claims FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update claims" ON public.claims FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read reimbursements" ON public.reimbursements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert reimbursements" ON public.reimbursements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update reimbursements" ON public.reimbursements FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read priority_payouts" ON public.priority_payouts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert priority_payouts" ON public.priority_payouts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update priority_payouts" ON public.priority_payouts FOR UPDATE USING (auth.role() = 'authenticated');
