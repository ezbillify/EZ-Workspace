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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("workspace_notes")
      .select("*, owner:employees!workspace_notes_owner_id_fkey(id,name,employee_id)")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Ownership check
    if (data.owner_id === userId) {
      return NextResponse.json({ note: data, accessLevel: 'owner' });
    }

    // Share check
    const { data: share } = await supabase
      .from("workspace_shares")
      .select("access_level")
      .eq("item_id", id)
      .eq("user_id", userId)
      .single();

    if (!share) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    return NextResponse.json({ note: data, accessLevel: share.access_level });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { title, content, is_pinned, color, status, tags, last_edited_by } = body;

    // 1. Fetch current note to check ownership
    const { data: current, error: fetchError } = await supabase
      .from("workspace_notes")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // 2. Permission logic
    let hasEditAccess = current.owner_id === userId;
    
    if (!hasEditAccess) {
      const { data: share } = await supabase
        .from("workspace_shares")
        .select("access_level")
        .eq("item_id", id)
        .eq("user_id", userId)
        .single();
      
      if (share?.access_level === 'edit') {
        hasEditAccess = true;
      }
    }

    if (!hasEditAccess) {
      return NextResponse.json({ error: "No edit permission" }, { status: 403 });
    }

    const update: Record<string, any> = { last_edited_at: new Date().toISOString() };
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (is_pinned !== undefined) update.is_pinned = is_pinned;
    if (color !== undefined) update.color = color;
    if (status !== undefined) update.status = status;
    if (tags !== undefined) update.tags = tags;
    if (last_edited_by !== undefined) update.last_edited_by = last_edited_by;

    const { data, error } = await supabase
      .from("workspace_notes")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ note: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("workspace_notes").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
