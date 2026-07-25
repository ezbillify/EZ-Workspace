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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // @sparticuz/chromium + puppeteer-core must stay external so the Chromium binary
  // ships intact to the serverless function (bundling it breaks executablePath()).
  serverExternalPackages: ["mongoose", "puppeteer", "puppeteer-core", "@sparticuz/chromium", "pdfjs-dist"],
  // Externalizing keeps the JS from being bundled, but Next's file tracer still
  // won't copy the Chromium binary archives (bin/*.br) into the serverless function
  // because they're loaded via a computed path. Force-include them for the routes
  // that generate PDFs, otherwise executablePath() fails with "bin does not exist".
  outputFileTracingIncludes: {
    "/api/onboarding/**": ["./node_modules/@sparticuz/chromium/**"],
    "/api/invoices/**": ["./node_modules/@sparticuz/chromium/**"],
  },
  webpack(config) {
    // pdfjs-dist needs canvas alias to prevent server-side canvas import errors
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/carrer", destination: "/careers", permanent: true },
      { source: "/carrers", destination: "/careers", permanent: true },
    ];
  },
};

export default nextConfig;
