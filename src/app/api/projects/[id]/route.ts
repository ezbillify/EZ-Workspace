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
      .from("projects")
      .select("*, client:clients(*), teams:project_teams(team:teams(*))")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        teams: data.teams?.map((t: any) => t.team) || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await req.json();
    const { 
      name, description, budget, client_id, phase, issued_date, 
      due_date, team_ids, is_active, budget_id, department_id, 
      progress, manager_id, workflow_status 
    } = body;

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name        !== undefined) payload.name        = name;
    if (description !== undefined) payload.description = description;
    if (budget      !== undefined) payload.budget      = Number(budget);
    if (client_id   !== undefined) payload.client_id   = client_id;
    if (phase       !== undefined) payload.phase       = phase;
    if (issued_date !== undefined) payload.issued_date = issued_date;
    if (due_date    !== undefined) payload.due_date    = due_date;
    if (is_active   !== undefined) payload.is_active   = is_active;
    if (budget_id   !== undefined) payload.budget_id   = budget_id || null;
    if (department_id !== undefined) payload.department_id = department_id || null;
    if (manager_id    !== undefined) payload.manager_id    = manager_id || null;
    if (workflow_status !== undefined) payload.workflow_status = workflow_status;

    // Progress can only be set once; once locked, cannot be changed
    if (progress !== undefined) {
      const { data: existing } = await supabase.from("projects").select("progress_locked").eq("id", id).single();
      if (!existing?.progress_locked) {
        payload.progress = Number(progress);
        payload.progress_locked = true; // lock after first save
      }
    }

    const { error: pError } = await supabase.from("projects").update(payload).eq("id", id);
    if (pError) throw pError;

    if (team_ids !== undefined) {
      await supabase.from("project_teams").delete().eq("project_id", id);
      if (team_ids.length > 0) {
        await supabase.from("project_teams").insert(
          team_ids.map((tid: string) => ({ project_id: id, team_id: tid }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
