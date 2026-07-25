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

import { NextResponse } from "next/server";
import { launchBrowser } from "@/lib/browser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let browser: any = null;
  try {
    const { htmlContent, invoiceNumber } = await req.json();

    if (!htmlContent) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    console.log("[PDF Generator] Starting PDF generation for", invoiceNumber);
    const startTime = performance.now();

    // Launch browser (serverless-safe)
    browser = await launchBrowser();

    const page = await browser.newPage();

    // Set viewport to A4 size
    await page.setViewport({ width: 794, height: 1123 });

    // Set content
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: 0,
      printBackground: true,
      preferCSSPageSize: true,
      scale: 1,
    });

    await page.close();

    // Convert to base64 - Puppeteer returns a Buffer, convert it properly
    const pdfBase64 = Buffer.isBuffer(pdfBuffer)
      ? pdfBuffer.toString("base64")
      : Buffer.from(pdfBuffer).toString("base64");

    const generationTime = performance.now() - startTime;
    console.log(`[PDF Generator] ✓ PDF generated in ${(generationTime / 1000).toFixed(2)}s, size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    return NextResponse.json({
      success: true,
      pdfBase64,
      fileSize: pdfBuffer.length,
      fileName: `${invoiceNumber}.pdf`,
    });
  } catch (error: any) {
    console.error("[PDF Generator] Error:", error.message);
    return NextResponse.json(
      { error: `PDF generation failed: ${error.message}` },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
