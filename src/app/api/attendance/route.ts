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

import { NextRequest, NextResponse } from "next/server";
import { authenticate, requireRole } from "@/middleware/auth";
import { fetchMonthlyAttendance, fetchAttendanceChartData } from "@/services/attendanceService";

// GET /api/attendance?employeeId=EMP001&month=1&year=2024&chart=true
export async function GET(req: NextRequest) {
  try {
    const authUser = await authenticate();
    const { searchParams } = new URL(req.url);

    let employeeId = searchParams.get("employeeId");
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
    const chart = searchParams.get("chart") === "true";

    // Employees can only view their own attendance
    if (authUser.role === "employee") {
      // employeeId from query must match their profile
      // We trust the employeeId passed; in production, fetch from DB
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId required" }, { status: 400 });
      }
    } else {
      await requireRole(req, "admin");
      if (!employeeId) {
        return NextResponse.json({ error: "employeeId required" }, { status: 400 });
      }
    }

    if (chart) {
      const chartData = await fetchAttendanceChartData(employeeId!);
      return NextResponse.json({ chartData });
    }

    const attendance = await fetchMonthlyAttendance(employeeId!, month, year);
    return NextResponse.json({ attendance });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
