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
-- ATTENDANCE PROTOCOLS — NUCLEAR FIX (DROP + RECREATE)
-- This drops the table entirely and recreates it clean.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Step 1: Drop the old broken table completely
DROP TABLE IF EXISTS public.attendance_protocols CASCADE;

-- Step 2: Create it fresh with the exact columns the app needs
CREATE TABLE public.attendance_protocols (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT         NOT NULL,
  check_in_time   TEXT         NOT NULL DEFAULT '09:00:00',
  check_out_time  TEXT         NOT NULL DEFAULT '18:00:00',
  target_type     TEXT         NOT NULL DEFAULT 'All',
  type            TEXT         NOT NULL DEFAULT 'All',
  days            TEXT[]       NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  effective_from  DATE         NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT         NOT NULL DEFAULT 'active',
  created_by      UUID,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Step 3: No RLS — admin control is at UI level
ALTER TABLE public.attendance_protocols DISABLE ROW LEVEL SECURITY;

-- Step 4: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
