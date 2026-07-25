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
import { supabase } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(
  req: NextRequest,
  { params }: Ctx
) {
  try {
    const { id: taskId } = await params;
    const body = await req.json();
    const { status, spentHours } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status required" },
        { status: 400 }
      );
    }

    const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update task status
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (spentHours !== undefined) {
      updateData.spent_hours = spentHours;
    }

    const { data, error } = await supabase
      .from("project_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select(`
        id,
        project_id,
        title,
        status,
        priority,
        assigned_to,
        due_date,
        estimated_hours,
        spent_hours,
        updated_at,
        assignee:employees!assigned_to(id, name, email)
      `);

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Get updated project progress
    const { data: projectData } = await supabase
      .from("projects")
      .select("id, progress")
      .eq("id", data[0].project_id)
      .single();

    return NextResponse.json({
      success: true,
      data: data[0],
      project: projectData,
      message: "Task status updated successfully",
    });
  } catch (err: any) {
    console.error("Task status update error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update task status" },
      { status: 500 }
    );
  }
}
