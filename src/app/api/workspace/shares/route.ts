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

export async function POST(req: Request) {
  try {
    const { itemId, itemType, itemTitle, shares, message } = await req.json();
    const supabase = getSupabaseAdmin();

    const shareData = shares.map((s: any) => ({
      item_id: itemId,
      item_type: itemType,
      item_title: itemTitle,
      user_id: s.userId,
      permission: s.accessLevel || "view",
      message: message || "",
    }));

    const { error } = await supabase
      .from("workspace_shares")
      .upsert(shareData, { onConflict: "item_type,item_id,user_id" });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return NextResponse.json({ sharedUsers: [] });

    const supabase = getSupabaseAdmin();

    // Try the view first, fall back to direct join if view doesn't exist yet
    const { data, error } = await supabase
      .from("workspace_shared_users")
      .select("*")
      .eq("item_id", itemId);

    if (error) {
      // Fallback: direct query with join
      const { data: raw, error: err2 } = await supabase
        .from("workspace_shares")
        .select("id, permission, message, user_id, employees!workspace_shares_user_id_fkey(id,name,employee_id,role)")
        .eq("item_id", itemId);

      if (err2) throw err2;
      const mapped = (raw || []).map((r: any) => ({
        id: r.id,
        permission: r.permission,
        user_id: r.employees?.id,
        user_name: r.employees?.name,
        user_employee_id: r.employees?.employee_id,
        user_role: r.employees?.role,
      }));
      return NextResponse.json({ sharedUsers: mapped });
    }

    return NextResponse.json({ sharedUsers: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get("shareId");
    if (!shareId) return NextResponse.json({ error: "shareId required" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("workspace_shares").delete().eq("id", shareId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
