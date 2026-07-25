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

// ── POST /api/meetings/analyze ───────────────────────────────────────────────
// Body: { transcript, meeting_title, participants: string[], duration_minutes }
// Returns: { summary, key_topics, decisions, action_items }
export async function POST(req: NextRequest) {
  const { transcript, meeting_title, participants, duration_minutes } = await req.json();

  if (!transcript?.trim())
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  const systemPrompt = `You are an expert meeting analyst. Analyze the provided meeting transcript and extract structured information. Always respond with valid JSON only, no markdown, no extra text.`;

  const userPrompt = `Meeting: "${meeting_title}"
Duration: ${duration_minutes || "unknown"} minutes
Participants: ${participants?.join(", ") || "unknown"}

TRANSCRIPT:
${transcript}

Analyze this meeting and return a JSON object with exactly these fields:
{
  "summary": "2-4 sentence executive summary of the entire meeting",
  "key_topics": ["topic 1", "topic 2", ...],
  "decisions": ["decision made 1", "decision made 2", ...],
  "action_items": [
    {
      "task": "clear description of what needs to be done",
      "assignee_name": "name of person responsible (from participants list, or 'Unassigned')",
      "due_date": "YYYY-MM-DD or null if not mentioned",
      "done": false
    }
  ],
  "sentiment": "positive | neutral | negative",
  "meeting_effectiveness": "high | medium | low",
  "follow_up_required": true or false
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 });
  }

  const claude = await response.json();
  const raw = claude.content?.[0]?.text || "";

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse Claude response", raw }, { status: 500 });
  }
}
