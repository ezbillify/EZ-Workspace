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

-- ════════════════════════════════════════════════════════════════════════════
-- Onboarding "Manual Entry" permission.
-- Controls the Manual Entry tab in Start New Onboarding (add a candidate by hand,
-- bypassing the interview pipeline). Admin-only by default; admins can grant it
-- to other roles in /admin/permissions. Idempotent.
-- ════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  all_roles TEXT[] := ARRAY['admin','dept_lead','team_lead','employee','intern'];
  r TEXT;
BEGIN
  FOREACH r IN ARRAY all_roles LOOP
    INSERT INTO role_permissions
      (role, module_key, can_view, can_create, can_edit, can_delete, can_export)
    VALUES (r, 'onboarding_manual', false, false, false, false, false)
    ON CONFLICT (role, module_key) DO NOTHING;
  END LOOP;
END $$;

-- Admin: can use Manual Entry.
UPDATE role_permissions
SET can_view = true
WHERE role = 'admin' AND module_key = 'onboarding_manual';
