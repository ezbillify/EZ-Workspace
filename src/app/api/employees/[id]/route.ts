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
import { getSupabaseAdmin } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: employeeId } = await params;
    console.log(`[API] Fetching employee: ${employeeId}`);

    if (!employeeId) {
      console.warn("[API] No employee ID provided");
      return NextResponse.json(
        { success: false, error: "Employee ID required" },
        { status: 400 }
      );
    }

    // Query with all available columns using Admin client to ensure full profile sync
    console.log("[API] Querying Supabase for employee...");
    const supabase = getSupabaseAdmin();
    const { data: dataArray, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .limit(1);

    const data = Array.isArray(dataArray) && dataArray.length > 0 ? dataArray[0] : null;

    if (error) {
      console.error("[API] Supabase error:", {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint
      });
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to fetch employee",
          details: (error as any).details
        },
        { status: 500 }
      );
    }

    if (!data) {
      console.warn("[API] Employee not found for ID:", employeeId);
      console.warn("[API] This user exists in auth but has no employee record");
      return NextResponse.json(
        {
          success: false,
          error: "Employee record not found. Please create an employee profile in the admin panel.",
          userId: employeeId,
          hint: "Go to Admin > Employees > Add Employee to create your profile"
        },
        { status: 404 }
      );
    }

    console.log("[API] Employee found:", {
      id: data.id,
      name: data.name,
      has_salary_min: data.salary_min !== undefined,
      has_salary_max: data.salary_max !== undefined
    });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (err: any) {
    console.error("[API] Unexpected error:", {
      message: err.message,
      stack: err.stack
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("employees")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
