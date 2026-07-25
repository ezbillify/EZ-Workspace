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

/**
 * Shared Ollama AI helper — works with any Ollama-compatible endpoint.
 * Configured via env vars:
 *   LOCAL_AI_ENDPOINT  — e.g. https://ollama.ezbillify.in/api/generate
 *   LOCAL_AI_MODEL     — e.g. gemma4:e4b  (default: gemma4:e4b)
 *   AI_BRIDGE_KEY      — Bearer token for your Ollama proxy
 */

export async function callAI(prompt: string, jsonMode = false): Promise<string> {
  const endpoint = process.env.LOCAL_AI_ENDPOINT;
  const model = process.env.LOCAL_AI_MODEL || "gemma4:e4b";
  const bridgeKey = process.env.AI_BRIDGE_KEY;

  if (!endpoint) throw new Error("LOCAL_AI_ENDPOINT is not set");
  if (!bridgeKey) throw new Error("AI_BRIDGE_KEY is not set");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${bridgeKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      ...(jsonMode && { format: "json" }),
      options: { temperature: 0.7, num_predict: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.response;
  if (!text) throw new Error("Empty response from Ollama");
  return text;
}

/** Parse JSON from Ollama response — strips markdown fences if present */
export function parseAIJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned) as T;
}
