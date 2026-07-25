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

-- Fix RLS for attendance_logs to allow users to manage their own logs
-- And cleanup any accidental records for April 25, 2026

-- 1. Enable RLS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own logs" ON attendance_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON attendance_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON attendance_logs;

-- 3. Create fresh policies
CREATE POLICY "Users can view own logs" ON attendance_logs
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own logs" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own logs" ON attendance_logs
  FOR UPDATE USING (auth.uid() = employee_id);

-- 4. Cleanup the "false info" record for April 25, 2026
-- This allows the user to perform a fresh Check In
DELETE FROM attendance_logs 
WHERE date = '2026-04-25' 
AND (clock_in = clock_out OR clock_out IS NOT NULL);

-- 5. Ensure the table has the correct unique constraint for upsert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'attendance_logs_emp_date_key'
    ) THEN
        ALTER TABLE attendance_logs ADD CONSTRAINT attendance_logs_emp_date_key UNIQUE (employee_id, date);
    END IF;
END $$;
