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

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 023: Fix duplicate channels + enforce team name as channel name
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Remove duplicate global channels (keep the oldest) ───────────────────
DELETE FROM channels
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM channels
  ORDER BY name, created_at ASC
);

-- ─── 2. Fix team channel names to use actual team name (not slugified) ────────
UPDATE channels c
SET name = t.name
FROM teams t
WHERE c.team_id = t.id;

-- ─── 3. Drop the name unique constraint (team names may not be globally unique)
-- Instead enforce: one channel per team (already have UNIQUE on team_id)
-- and one channel per global name
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_name_unique;

-- ─── 4. Re-add admin memberships after dedup ─────────────────────────────────
INSERT INTO channel_members (channel_id, employee_id)
SELECT c.id, e.id
  FROM channels c
  CROSS JOIN employees e
 WHERE e.role IN ('super_admin', 'accounts')
   AND e.is_active = true
ON CONFLICT (channel_id, employee_id) DO NOTHING;

-- ─── 5. Fix the seed insert in future runs to use ON CONFLICT on team_id ──────
-- Update trg_team_create_channel to use team name directly (not slugified)
CREATE OR REPLACE FUNCTION trg_team_create_channel()
RETURNS TRIGGER AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  INSERT INTO channels (name, description, type, team_id, is_global)
  VALUES (
    NEW.name,
    'Channel for ' || NEW.name || ' team',
    'text',
    NEW.id,
    false
  )
  ON CONFLICT (team_id) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_channel_id;

  IF v_channel_id IS NOT NULL THEN
    INSERT INTO channel_members (channel_id, employee_id)
    SELECT v_channel_id, e.id
      FROM employees e
     WHERE e.team_id = NEW.id AND e.is_active = true
    ON CONFLICT (channel_id, employee_id) DO NOTHING;

    -- Add admins to new team channel
    INSERT INTO channel_members (channel_id, employee_id)
    SELECT v_channel_id, e.id
      FROM employees e
     WHERE e.role IN ('super_admin', 'accounts') AND e.is_active = true
    ON CONFLICT (channel_id, employee_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. Verify result ────────────────────────────────────────────────────────
SELECT c.name, c.type, c.is_global, t.name as team_name, COUNT(cm.employee_id) as members
FROM channels c
LEFT JOIN teams t ON t.id = c.team_id
LEFT JOIN channel_members cm ON cm.channel_id = c.id
GROUP BY c.id, c.name, c.type, c.is_global, t.name
ORDER BY c.is_global DESC, c.name;
