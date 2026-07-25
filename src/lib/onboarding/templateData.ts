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

import type { ConfigCategory, OnboardingConfig, OnboardingSignature, TemplateData } from "./types";

function fmtLong(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

// Accepts either normalized {name,email,…} or the packet/form shape {candidate_name,…}.
type CandidateInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string | null;
  candidate_address?: string | null;
};

/** Assemble the data object every document template consumes. */
export function buildTemplateData(opts: {
  candidate: CandidateInput;
  config: OnboardingConfig;
  schema: ConfigCategory[];
  signatory: { name: string; designation: string; companyName: string; signatureUrl?: string | null; sealUrl?: string | null };
  signature?: OnboardingSignature | null;
  offerDateISO?: string | null; // when the offer was issued/sent; defaults to today
}): TemplateData {
  const c = opts.candidate;
  const dateBase = opts.offerDateISO ? new Date(opts.offerDateISO) : new Date();
  return {
    offerDate: fmtLong(isNaN(dateBase.getTime()) ? new Date() : dateBase),
    candidate: {
      name: c.name ?? c.candidate_name ?? "",
      email: c.email ?? c.candidate_email ?? "",
      phone: c.phone ?? c.candidate_phone ?? "",
      address: c.address ?? c.candidate_address ?? "",
    },
    config: opts.config || {},
    schema: opts.schema,
    signature: opts.signature ?? null,
    signatory: opts.signatory,
  };
}
