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
-- 098: Add Missing Columns (matrix_role, shift_id) to employees
-- ============================================================================

-- Add matrix_role and shift_id directly to employees table
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS matrix_role TEXT,
  ADD COLUMN IF NOT EXISTS shift_id UUID;

-- (Optional) If shifts table exists, add foreign key
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'shifts'
    ) THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_employee_shift'
        ) THEN
            ALTER TABLE employees 
            ADD CONSTRAINT fk_employee_shift 
            FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;
