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
-- NUCLEAR DATA CLEAR — Paste into Supabase SQL Editor and Run
-- Dynamically reads pg_tables so only EXISTING tables are truncated.
-- Zero "relation does not exist" errors.
-- ============================================================================

-- 1. Bypass all FK constraints
SET session_replication_role = replica;

-- 2. Truncate every public table that exists (skips config tables)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN (
    SELECT tablename
    FROM   pg_tables
    WHERE  schemaname = 'public'
    AND    tablename NOT IN (
      -- ── Keep these config tables intact ──────────────
      'role_permissions',      -- module access config per role
      'system_config',         -- SMTP, company name, etc.
      'attendance_settings',   -- shift / attendance config
      'support_routing_rules'  -- ticket routing rules
    )
    ORDER BY tablename
  )
  LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl) || ' CASCADE';
    RAISE NOTICE 'Cleared: %', tbl;
  END LOOP;
END $$;

-- 3. Restore FK checks
SET session_replication_role = DEFAULT;

-- ============================================================================
-- DONE. All employee, team, project, payslip, KPI, incentive,
-- messaging, LMS, CRM, finance data is now wiped.
--
-- NEXT STEPS:
-- 1. Go to Supabase Dashboard → Authentication → Users
--    → Select All → Delete  (employees table is empty now, so no FK error)
-- 2. Re-create your admin:  npx tsx src/scripts/create-admin.ts
-- 3. Import fresh employees / departments / teams via the app
-- ============================================================================
