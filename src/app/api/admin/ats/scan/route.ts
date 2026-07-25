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
import { callAI, parseAIJSON } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: "Missing resume or job description" }, { status: 400 });
    }

    const prompt = `
Perform an ATS analysis.

Job Description:
${jobDescription}

Resume:
${resumeText}

Return ONLY a JSON object:
{
  "score": <number 0-100>,
  "match": <string[] of matching keywords/skills>,
  "missing": <string[] of missing critical keywords/skills>,
  "tips": <string[] of at least 3 actionable tips to improve the resume>
}
`;

    const raw = await callAI(prompt, true);
    const result = parseAIJSON<{ score: number; match: string[]; missing: string[]; tips: string[] }>(raw);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("ATS Scan error:", error.message);
    return NextResponse.json({ error: "AI scan failed", details: error.message, score: 0, match: [], missing: [], tips: [] }, { status: 500 });
  }
}
