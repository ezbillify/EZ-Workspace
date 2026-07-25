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

// GET /api/mail/files/open?id=<uuid>
// Decodes the base64 data URL stored in mail_file_shares and serves the raw binary
// so Chrome opens it as a proper file (no "Not secure" / about:blank issues).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: file, error } = await supabase
    .from("mail_file_shares")
    .select("storage_url, filename, file_type")
    .eq("id", id)
    .single();

  if (error || !file) return new NextResponse("File not found", { status: 404 });

  const { storage_url, filename, file_type } = file as {
    storage_url: string;
    filename: string;
    file_type: string;
  };

  if (!storage_url) return new NextResponse("No file content", { status: 404 });

  // If it's not a base64 data URL, redirect to the URL directly
  if (!storage_url.startsWith("data:")) {
    return NextResponse.redirect(storage_url);
  }

  // Parse the data URL: "data:<mime>;base64,<b64data>"
  const commaIdx = storage_url.indexOf(",");
  if (commaIdx === -1) return new NextResponse("Invalid file data", { status: 500 });

  const header = storage_url.slice(0, commaIdx);        // "data:application/pdf;base64"
  const b64    = storage_url.slice(commaIdx + 1);       // base64 string

  const mime = file_type
    || (header.match(/data:([^;]+)/) || [])[1]
    || "application/octet-stream";

  const buffer = Buffer.from(b64, "base64");

  const safeFilename = encodeURIComponent(filename || "file");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        mime,
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      "Content-Length":      String(buffer.length),
      "Cache-Control":       "private, max-age=3600",
    },
  });
}
