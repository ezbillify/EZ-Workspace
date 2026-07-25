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

export function calculateCompanyScore(
  revenueAchievement: number,
  collections: number,
  deliveryHealth: number
): number {
  return parseFloat(((revenueAchievement + collections + deliveryHealth) / 3).toFixed(2));
}

export function getCompanyMultiplier(companyScore: number): number {
  if (companyScore < 60) return 0.5;
  if (companyScore < 80) return 0.7;
  if (companyScore < 100) return 1.0;
  if (companyScore < 110) return 1.1;
  return 1.2;
}

export function getEmployeeMultiplier(employeeScore?: number | null): number {
  if (employeeScore == null) return 1.0;
  if (employeeScore < 60) return 0.5;
  if (employeeScore < 80) return 0.7;
  if (employeeScore < 90) return 0.8;
  if (employeeScore < 95) return 1.0;
  return 1.2;
}

export function calculateFinalIncentive(
  fixedAmount: number,
  variableAmount: number,
  employeeMultiplier: number,
  companyMultiplier: number
): number {
  return parseFloat((fixedAmount + variableAmount * employeeMultiplier * companyMultiplier).toFixed(2));
}
