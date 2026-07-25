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

-- Robust Update for attendance_protocols
-- This script handles cases where 'time' might or might not exist

DO $$ 
BEGIN
    -- 1. Create table if it doesn't exist (safety first)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_protocols') THEN
        CREATE TABLE attendance_protocols (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            check_in_time TIME NOT NULL DEFAULT '09:00:00',
            check_out_time TIME NOT NULL DEFAULT '18:00:00',
            type TEXT NOT NULL DEFAULT 'All',
            days TEXT[] NOT NULL DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    ELSE
        -- 2. If table exists, check for 'time' and rename to 'check_in_time'
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_protocols' AND column_name='time') THEN
            ALTER TABLE attendance_protocols RENAME COLUMN "time" TO check_in_time;
        END IF;

        -- 3. Add check_in_time if missing (and 'time' didn't exist to rename)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_protocols' AND column_name='check_in_time') THEN
            ALTER TABLE attendance_protocols ADD COLUMN check_in_time TIME NOT NULL DEFAULT '09:00:00';
        END IF;

        -- 4. Add check_out_time if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_protocols' AND column_name='check_out_time') THEN
            ALTER TABLE attendance_protocols ADD COLUMN check_out_time TIME NOT NULL DEFAULT '18:00:00';
        END IF;
    END IF;
END $$;
