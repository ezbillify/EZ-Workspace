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

-- Migration 090: Reset permissions to "Disabled by Default"
-- Goal: Ensure all modules are hidden initially, even for Admin.
-- Only 'admin_dashboard' and 'permissions_control' stay visible for Admin to prevent lockout.

-- 1. Set all existing permissions to FALSE for all modules
UPDATE role_permissions
SET can_view = false, can_create = false, can_edit = false, can_delete = false, can_export = false;

-- 2. Restore essential access for Admin so they can actually use the dashboard and this page
UPDATE role_permissions
SET can_view = true, can_create = true, can_edit = true, can_delete = true, can_export = true
WHERE role = 'admin' AND module_key IN ('admin_dashboard', 'permissions_control');

-- 3. Restore basic self-service for all roles (My Profile, etc.) if you want them to be able to at least see their profile
-- Actually, the user said "dashboards disable first", so I'll be strict.
-- They can go and enable them manually now.
