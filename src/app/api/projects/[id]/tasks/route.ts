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

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const { data, error } = await supabase
      .from("project_tasks")
      .select(`*, assigned_to_employee:employees!assigned_to (id, name, employee_id)`)
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Enrich assignee_ids with employee details
    const allIds = [...new Set((data || []).flatMap((t: any) => t.assignee_ids || []))];
    let employeeMap: Record<string, { id: string; name: string; employee_id: string }> = {};
    if (allIds.length > 0) {
      const { data: emps } = await supabase
        .from("employees")
        .select("id, name, employee_id")
        .in("id", allIds);
      (emps || []).forEach((e: any) => { employeeMap[e.id] = e; });
    }

    const tasks = (data || []).map((t: any) => ({
      ...t,
      assignees: (t.assignee_ids || []).map((uid: string) => employeeMap[uid]).filter(Boolean),
    }));

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await req.json();

    const { title, description, status, priority, assignee_ids, due_date } = body;
    const primaryAssignee = assignee_ids?.[0] || null;

    const { data, error } = await supabase
      .from("project_tasks")
      .insert([{
        project_id: id,
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'Medium',
        assigned_to: primaryAssignee,
        assignee_ids: assignee_ids || [],
        due_date: due_date || null
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
