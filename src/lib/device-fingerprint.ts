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

// Lightweight device fingerprint for the e-sign audit trail. It hashes coarse
// device/browser signals into a SHA-256 hex string — NOT a tracking supercookie,
// just a tamper-evidence signal recorded next to the signature so the same session
// can be corroborated. Runs entirely in the browser (needs a secure context, which
// the camera step already requires); returns "unknown" if anything is unavailable.
export async function computeDeviceFingerprint(): Promise<string> {
  try {
    const nav = navigator as any;
    const parts = [
      navigator.userAgent,
      navigator.language,
      (navigator.languages || []).join(","),
      nav.platform || "",
      String(nav.hardwareConcurrency || ""),
      String(nav.deviceMemory || ""),
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      String(window.devicePixelRatio || ""),
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      canvasSignature(),
    ];
    const data = new TextEncoder().encode(parts.join("|"));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "unknown";
  }
}

function canvasSignature(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 60, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("namaah-esign", 2, 2);
    return canvas.toDataURL().slice(-64);
  } catch {
    return "";
  }
}
