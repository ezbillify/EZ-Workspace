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

-- Fix RLS policies for hierarchical delegation
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- project_teams policies
DROP POLICY IF EXISTS "Anyone can view project teams" ON project_teams;
CREATE POLICY "Anyone can view project teams" ON project_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and Managers can manage project teams" ON project_teams;
CREATE POLICY "Admins and Managers can manage project teams" ON project_teams FOR ALL
    USING (
        (SELECT role FROM employees WHERE id = auth.uid()) IN ('super_admin', 'manager', 'head')
    );

-- project_members policies
DROP POLICY IF EXISTS "Anyone can view project members" ON project_members;
CREATE POLICY "Anyone can view project members" ON project_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and Managers can manage project members" ON project_members;
CREATE POLICY "Admins and Managers can manage project members" ON project_members FOR ALL
    USING (
        (SELECT role FROM employees WHERE id = auth.uid()) IN ('super_admin', 'manager', 'head', 'lead')
    );

-- project_tasks policies (ensure managers can insert strategic tasks)
DROP POLICY IF EXISTS "Admins and Managers can create strategic tasks" ON project_tasks;
CREATE POLICY "Admins and Managers can create strategic tasks" ON project_tasks FOR INSERT
    WITH CHECK (
        (SELECT role FROM employees WHERE id = auth.uid()) IN ('super_admin', 'manager', 'head')
    );
