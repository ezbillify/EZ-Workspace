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

// Shared headless-browser launcher for server-side PDF generation.
//
// The problem this solves: bundled `puppeteer` expects a full Chrome install on
// disk. That works locally, but on Vercel's serverless sandbox there is no Chrome
// (the runtime failed with "Could not find Chrome ... /home/sbx_userXXXX/.cache/puppeteer").
//
// Fix: in serverless/production use `@sparticuz/chromium` (a Lambda-sized Chromium
// binary) driven by `puppeteer-core`; locally keep the full `puppeteer` with its
// bundled Chrome so dev needs no extra setup. Dynamic imports keep each path from
// pulling in the other's heavy dependency.
import type { Browser } from "puppeteer-core";

// Serverless when running on Vercel/Lambda. NODE_ENV alone isn't enough (a prod
// build could still run on a machine with Chrome), so key off the platform envs.
function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.FUNCTION_TARGET,
  );
}

/** Launch a headless browser that works both locally and on Vercel serverless. */
export async function launchBrowser(): Promise<Browser> {
  if (isServerless()) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return (await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(),
      headless: true,
    })) as unknown as Browser;
  }

  // Local dev / any host that has the full puppeteer Chrome download.
  const puppeteer = await import("puppeteer");
  return (await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })) as unknown as Browser;
}
