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

// Resolve the public base URL for building magic links sent to candidates.
// Priority: env var (when pointing at a real public domain) → request origin → localhost.
// This ensures emails triggered from localhost dev still contain nexus.namaah.io links,
// not http://localhost:3000 links the candidate can never reach.
export function baseUrlFrom(req?: { headers: Headers } | null): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  // If the env var is set to a real public domain (not localhost/127.*), always
  // use it — overrides the request origin so candidate emails always link to
  // the production domain even when the admin triggers the send from localhost.
  if (envUrl && !envUrl.includes("localhost") && !/127\.\d+\.\d+/.test(envUrl)) {
    return envUrl.replace(/\/+$/, "");
  }

  // Env var is localhost (dev with local testing) — fall back to request headers
  // so the link at least works for the dev machine.
  if (req) {
    const h = req.headers;
    const origin = h.get("origin");
    if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/+$/, "");
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ||
        (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  }

  return envUrl?.replace(/\/+$/, "") || "http://localhost:3000";
}
