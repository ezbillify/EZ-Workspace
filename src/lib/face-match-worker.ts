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

// Client for the optional standalone face-match worker (worker/face-match), which
// does TRUE server-side face extraction under tfjs-node on a container host. When
// FACE_MATCH_WORKER_URL is set, the e-sign verify route forwards the reference +
// live images here and uses the returned verdict as authoritative. When unset, the
// app falls back to its in-app encrypted-template descriptor comparison.

export interface WorkerVerdict {
  matched: boolean;
  distance: number;
  similarity: number;
  refFaces: number;
  liveFaces: number;
}

export function faceMatchWorkerConfigured(): boolean {
  return !!process.env.FACE_MATCH_WORKER_URL;
}

export async function matchViaWorker(referenceImage: string, liveImage: string): Promise<WorkerVerdict | null> {
  const base = process.env.FACE_MATCH_WORKER_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": process.env.FACE_MATCH_WORKER_SECRET || "",
      },
      body: JSON.stringify({ referenceImage, liveImage }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const j: any = await res.json().catch(() => null);
    if (!j?.ok) return null;
    return {
      matched: !!j.matched,
      distance: Number(j.distance),
      similarity: Number(j.similarity),
      refFaces: Number(j.refFaces) || 0,
      liveFaces: Number(j.liveFaces) || 0,
    };
  } catch {
    return null;
  }
}
