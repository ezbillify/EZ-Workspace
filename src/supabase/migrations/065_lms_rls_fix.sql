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

-- LMS RLS POLICY EXTENSION (PERMISSIVE)
-- Version: 1.3

-- 1. Modules
ALTER TABLE lms_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees can view modules" ON lms_modules;
CREATE POLICY "Employees can view modules" ON lms_modules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage modules" ON lms_modules;
CREATE POLICY "Admins manage modules" ON lms_modules FOR ALL USING (true);

-- 2. Lessons
ALTER TABLE lms_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees can view lessons" ON lms_lessons;
CREATE POLICY "Employees can view lessons" ON lms_lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage lessons" ON lms_lessons;
CREATE POLICY "Admins manage lessons" ON lms_lessons FOR ALL USING (true);

-- 3. Enrollments
ALTER TABLE lms_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees can view own enrollments" ON lms_enrollments;
CREATE POLICY "Employees can view own enrollments" ON lms_enrollments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage enrollments" ON lms_enrollments;
CREATE POLICY "Admins manage enrollments" ON lms_enrollments FOR ALL USING (true);

-- 4. Certifications
ALTER TABLE lms_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees can view own certifications" ON lms_certifications;
CREATE POLICY "Employees can view own certifications" ON lms_certifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage certifications" ON lms_certifications;
CREATE POLICY "Admins manage certifications" ON lms_certifications FOR ALL USING (true);

-- 5. Fix Courses
DROP POLICY IF EXISTS "Employees can view courses" ON lms_courses;
CREATE POLICY "Employees can view courses" ON lms_courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage courses" ON lms_courses;
CREATE POLICY "Admins manage courses" ON lms_courses FOR ALL USING (true);
