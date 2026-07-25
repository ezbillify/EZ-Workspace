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
    const { currentRole, targetRole, skills } = await req.json();

    if (!currentRole || !targetRole) {
      return NextResponse.json({ error: "Missing currentRole or targetRole" }, { status: 400 });
    }

    const prompt = `
You are an expert career advisor.

A professional wants to transition from "${currentRole}" to "${targetRole}".
Their current skills: ${skills || "not specified"}.

Return ONLY a JSON object:
{
  "roadmap": [
    { "step": "Phase 1: <title>", "action": "<detailed action>", "skills": "<skill or resource>" },
    { "step": "Phase 2: <title>", "action": "<detailed action>", "skills": "<skill or resource>" },
    { "step": "Phase 3: <title>", "action": "<detailed action>", "skills": "<skill or resource>" }
  ],
  "mentorTip": "<one high-level strategic tip>"
}
`;

    const raw = await callAI(prompt, true);
    const result = parseAIJSON<{ roadmap: any[]; mentorTip: string }>(raw);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Career advice error:", error.message);
    return NextResponse.json({
      roadmap: [{ step: "Error", action: "Could not generate roadmap. Please try again.", skills: "" }],
      mentorTip: error.message || "AI unavailable",
    }, { status: 500 });
  }
}
