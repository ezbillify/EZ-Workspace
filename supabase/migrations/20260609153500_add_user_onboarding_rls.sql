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

-- ─── Add RLS policies for user_onboarding table ─────────────────────────────

-- Drop existing policies if they happen to exist
DROP POLICY IF EXISTS "Allow users to read their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Allow users to insert their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Allow users to update their own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Allow admins to read all onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Allow admins to insert onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Allow admins to update onboarding" ON public.user_onboarding;

-- Allow users to read their own onboarding row
CREATE POLICY "Allow users to read their own onboarding" 
ON public.user_onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own onboarding row
CREATE POLICY "Allow users to insert their own onboarding" 
ON public.user_onboarding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own onboarding row
CREATE POLICY "Allow users to update their own onboarding" 
ON public.user_onboarding 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all onboarding rows
CREATE POLICY "Allow admins to read all onboarding"
ON public.user_onboarding
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Allow admins to insert onboarding rows
CREATE POLICY "Allow admins to insert onboarding"
ON public.user_onboarding
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Allow admins to update onboarding rows
CREATE POLICY "Allow admins to update onboarding"
ON public.user_onboarding
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);
