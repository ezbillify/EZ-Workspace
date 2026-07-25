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

-- ============================================================
-- SYSTEM REPAIR: DELETION STABILITY & AUTH PURGE
-- ============================================================

-- 1. UNIVERSAL FIX: Crash-proof the update_updated_at_column function
-- This ensures that ANY table trying to update a timestamp during a delete or update
-- will no longer crash if the column is missing.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- If we are in a DELETE operation, just return OLD and exit.
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;

    -- If NEW is null (shouldn't happen in UPDATE/INSERT but being safe)
    IF (NEW IS NULL) THEN
        RETURN NULL;
    END IF;

    -- Safety check: Only set updated_at if the column exists in the record.
    -- This prevents the "record new has no field" error.
    BEGIN
        NEW.updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if column is missing
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. SCHEMA SYNC: Add missing columns to all operational tables
-- This ensures data consistency across Teams, Projects, and Wallets.
ALTER TABLE IF EXISTS public.project_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. PROGRESS SYNC: Fix the progress calculation script
-- Ensures that when tasks are deleted (cascading from employee deletion), 
-- the project progress is recalculated without crashing.
CREATE OR REPLACE FUNCTION public.calculate_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_project_id UUID;
BEGIN
    -- Correctly identify project ID even during a Delete operation
    IF (TG_OP = 'DELETE') THEN
        v_project_id := OLD.project_id;
    ELSE
        v_project_id := NEW.project_id;
    END IF;

    IF v_project_id IS NOT NULL THEN
        UPDATE public.projects SET progress = (
            SELECT COALESCE(ROUND((COUNT(*) FILTER (WHERE status = 'COMPLETED')::NUMERIC / NULLIF(COUNT(*), 0)) * 100), 0)
            FROM public.project_tasks WHERE project_id = v_project_id
        ) WHERE id = v_project_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. AUTH SECURITY: Automatic Auth Purge
-- Ensures that when an employee is deleted from the DB, their login user 
-- in Supabase Auth is also purged to maintain system security.
CREATE OR REPLACE FUNCTION public.trg_purge_auth_user_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Use the service_role power to delete the user from auth.users
  -- Note: This requires the trigger to be defined properly or called from a service-role context
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: If auth delete fails (e.g. permissions), don't block the DB delete
  RAISE WARNING 'Could not purge auth user for id %: %', OLD.id, SQLERRM;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Re-apply the auth purge trigger to the employees table
DROP TRIGGER IF EXISTS on_employee_deleted_purge_auth ON public.employees;
CREATE TRIGGER on_employee_deleted_purge_auth
    AFTER DELETE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION trg_purge_auth_user_on_delete();

-- 5. SYSTEM RELOAD
NOTIFY pgrst, 'reload schema';
