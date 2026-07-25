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
import { requireModule } from "@/lib/authz";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: teams, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ teams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const gate = await requireModule("teams", "can_create");
    if (!gate.ok) return gate.response;

    const supabase = getSupabaseAdmin();
    const body = await req.json();

    // Duplicate Guard: Check if a node with same name, type, and parent already exists
    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .eq("name", body.name)
      .eq("type", body.type)
      .eq("parent_id", body.parent_id || null)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `A ${body.type} named "${body.name}" already exists under the same parent.` },
        { status: 409 }
      );
    }

    const { data: team, error } = await supabase
      .from("teams")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ team });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const gate = await requireModule("teams", "can_edit");
    if (!gate.ok) return gate.response;

    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID required for update." }, { status: 400 });

    const { data: team, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ team });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const gate = await requireModule("teams", "can_delete");
    if (!gate.ok) return gate.response;

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Cascade: also delete all children of this node recursively
    async function deleteChildren(parentId: string) {
      const { data: children } = await supabase
        .from("teams")
        .select("id")
        .eq("parent_id", parentId);

      if (children && children.length > 0) {
        for (const child of children) {
          await deleteChildren(child.id);
        }
        await supabase.from("teams").delete().eq("parent_id", parentId);
      }
    }

    await deleteChildren(id);
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
