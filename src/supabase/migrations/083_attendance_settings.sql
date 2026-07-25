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

-- 083_attendance_settings.sql

CREATE TABLE IF NOT EXISTS attendance_settings (
    id SERIAL PRIMARY KEY,
    holiday_is_paid_leave BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES employees(id)
);

-- Seed initial row if not exists
INSERT INTO attendance_settings (id, holiday_is_paid_leave) 
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'attendance_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance_settings;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE attendance_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings
CREATE POLICY "Allow all employees to read attendance settings" 
ON attendance_settings FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins to update settings
CREATE POLICY "Allow admins to manage attendance settings" 
ON attendance_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM employees 
    WHERE id = auth.uid() 
    AND role::text IN ('super_admin', 'manager', 'hr')
  )
);
