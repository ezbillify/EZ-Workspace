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

-- ─── SHIFT MANAGEMENT RLS POLICIES ───────────────────────
-- Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Allow all authenticated users to view shift protocols
CREATE POLICY "Enable select for all users" ON shifts
FOR SELECT TO authenticated USING (true);

-- 2. INSERT: Allow authenticated users (Admins) to create new shifts
CREATE POLICY "Enable insert for authenticated" ON shifts
FOR INSERT TO authenticated WITH CHECK (true);

-- 3. UPDATE: Allow authenticated users to modify shifts
CREATE POLICY "Enable update for authenticated" ON shifts
FOR UPDATE TO authenticated USING (true);

-- 4. DELETE: Allow authenticated users to decommission shifts
CREATE POLICY "Enable delete for authenticated" ON shifts
FOR DELETE TO authenticated USING (true);

-- ─── Employee RLS Policy for Shifts ────────────────────
-- Ensure authenticated users can link employees to shifts
-- (Usually covered by general employee update policy, but being explicit helps)
CREATE POLICY "Allow shift assignment" ON employees
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
