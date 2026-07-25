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

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    // System Config is a pure singleton, always fetch strictly the first row safely.
    const { data: config, error } = await supabase.from("system_config").select("*").limit(1).single();
    
    if (error) {
      // If no row exists, create the structural blank slate
      if (error.code === 'PGRST116') {
        const { data: newConfig } = await supabase.from("system_config").insert({ revenue: 0 }).select().single();
        return NextResponse.json({ config: newConfig });
      }
      return NextResponse.json({ error: "System Registry Fault: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ config });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Exception: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();

    const { data: existing, error: findError } = await supabase.from("system_config").select("id").limit(1).single();

    if (findError && findError.code !== 'PGRST116') {
      return NextResponse.json({ error: "System Verification Fault" }, { status: 500 });
    }

    let result;
    if (!existing) {
      const { data, error } = await supabase.from("system_config").insert(body).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase.from("system_config").update(body).eq("id", existing.id).select().single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ config: result });
  } catch (error: any) {
    return NextResponse.json({ error: "Configuration Deployment Fault: " + error.message }, { status: 500 });
  }
}
