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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseCurrency = searchParams.get("from") || "INR";

  try {
    // Try primary API
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
      headers: { "User-Agent": "Finance-Dashboard" },
    });

    if (!res.ok) throw new Error("Primary API failed");

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    try {
      // Fallback to alternative API
      const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`);

      if (!res.ok) throw new Error("Fallback API failed");

      const data = await res.json();
      // Transform frankfurter format to exchangerate format
      return NextResponse.json({
        base: data.base,
        date: data.date,
        rates: data.rates,
      });
    } catch {
      // Return default rates if all APIs fail
      return NextResponse.json(
        {
          base: baseCurrency,
          rates: {
            INR: baseCurrency === "INR" ? 1 : 83,
            USD: baseCurrency === "USD" ? 1 : 0.012,
            EUR: baseCurrency === "EUR" ? 1 : 0.011,
            GBP: baseCurrency === "GBP" ? 1 : 0.0095,
          },
        },
        { status: 200 }
      );
    }
  }
}
