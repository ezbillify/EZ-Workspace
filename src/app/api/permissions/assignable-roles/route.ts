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

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  if (!role) {
    return NextResponse.json({ error: "role param required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("role_assignable_roles")
      .select("assignable_role")
      .eq("assigner_role", role);

    if (error) throw error;

    return NextResponse.json({
      assignableRoles: (data ?? []).map((r) => r.assignable_role),
    });
  } catch (err: any) {
    console.error("[GET /api/permissions/assignable-roles]", err);
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, assignableRoles } = body as {
      role: string;
      assignableRoles: string[];
    };

    if (!role || !Array.isArray(assignableRoles)) {
      return NextResponse.json(
        { error: "role and assignableRoles array are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Replace all entries for this assigner role
    const { error: delError } = await supabase
      .from("role_assignable_roles")
      .delete()
      .eq("assigner_role", role);

    if (delError) throw delError;

    if (assignableRoles.length > 0) {
      const { error: insError } = await supabase
        .from("role_assignable_roles")
        .insert(
          assignableRoles.map((assignable_role) => ({
            assigner_role: role,
            assignable_role,
          }))
        );
      if (insError) throw insError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/permissions/assignable-roles]", err);
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
