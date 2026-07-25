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
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { migrationName } = await req.json();

    if (!migrationName) {
      return NextResponse.json(
        { success: false, error: "Migration name required" },
        { status: 400 }
      );
    }

    // For security, only allow specific migrations
    const allowedMigrations = ["046_teams_and_project_members"];
    if (!allowedMigrations.includes(migrationName)) {
      return NextResponse.json(
        { success: false, error: "Migration not found" },
        { status: 400 }
      );
    }

    const migrationFile = path.join(
      process.cwd(),
      `src/supabase/migrations/${migrationName}.sql`
    );

    if (!fs.existsSync(migrationFile)) {
      return NextResponse.json(
        { success: false, error: "Migration file not found" },
        { status: 404 }
      );
    }

    const sql = fs.readFileSync(migrationFile, "utf-8");

    // Execute migration using Supabase RPC or direct execution
    // Note: This requires the exec_sql function to be set up in Supabase
    const statements = sql
      .split(";")
      .map((stmt: string) => stmt.trim())
      .filter((stmt: string) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`Executing ${statements.length} SQL statements from ${migrationName}`);

    // For now, we'll just return success and let the user run it manually
    // In production, you'd want to execute these statements directly
    return NextResponse.json({
      success: true,
      message: `Migration ${migrationName} ready to execute`,
      statementCount: statements.length,
      note: "Please run this migration through your Supabase dashboard SQL editor",
    });
  } catch (err: any) {
    console.error("Migration error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Migration failed" },
      { status: 500 }
    );
  }
}
