/*
 * Copyright (c) 2026 EZBillify Ventures Pvt Ltd. All rights reserved.
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
 * 
 * WARNING & LIABILITY DISCLAIMER:
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * IMPORTANT: WHOEVER COPIES, REDISTRIBUTES, OR USES THIS SOFTWARE MUST KNOW THAT
 * UNDER NO CIRCUMSTANCES CAN THEY RECOVER DAMAGES, LOSSES, OR LIABILITIES
 * ENCOUNTERED FROM THE USE, MODIFICATION, OR DISTRIBUTION OF THIS SOFTWARE.
 */

// Scoped "payroll intern" access.
//
// These accounts are temporary helpers who may ONLY use the internship stipend
// pages. They are locked down by email (not by role) because the restriction is
// per-account and temporary — add/remove an address here to grant/revoke access.
// Enforced in: login redirect (AuthProvider), root router, DashboardShell guard,
// and the Sidebar (which shows only the internship links for these accounts).

export const PAYROLL_INTERN_EMAILS = ["account.intern@namaah.io"];

// Landing page + the only navigable area for these accounts.
export const PAYROLL_INTERN_HOME = "/admin/payroll/internship";

export function isPayrollInternOnly(email?: string | null): boolean {
  return !!email && PAYROLL_INTERN_EMAILS.includes(email.trim().toLowerCase());
}

/** True when the path is inside the internship module these accounts may use. */
export function isPayrollInternPathAllowed(pathname?: string | null): boolean {
  if (!pathname) return false;
  return pathname === PAYROLL_INTERN_HOME || pathname.startsWith(PAYROLL_INTERN_HOME + "/");
}
