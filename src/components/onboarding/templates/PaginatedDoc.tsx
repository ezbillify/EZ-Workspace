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

"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { HEADER_MM, FOOTER_MM } from "./brand";
import { LetterheadHeader, LetterheadFooter } from "./docStyles";

const PX_PER_MM = 96 / 25.4;

// Height reserved at the bottom of each page body for the per-page sig strip.
const SIG_STRIP_MM = 6;

// Usable content height per page = A4 − header − sig strip − footer − body vertical padding (5mm × 2).
const USABLE_PX = (297 - HEADER_MM - SIG_STRIP_MM - FOOTER_MM - 10) * PX_PER_MM;

interface SigData {
  image_base64?: string | null;
  typed_name?: string | null;
}

function PageSigStrip({ sig, name, page, total }: { sig?: SigData | null; name?: string; page: number; total: number }) {
  return (
    <div className="od-pagesig">
      <span className="od-pagesig-lbl">Candidate:</span>
      <span className="od-pagesig-sig">
        {sig?.image_base64 && <img src={sig.image_base64} alt="candidate signature" />}
      </span>
      <span className="od-pagesig-name">{sig?.typed_name || name || "—"}</span>
      <span className="od-pagesig-pg">Page {page} of {total}</span>
    </div>
  );
}

/**
 * Splits a flat list of flowable block nodes into discrete A4 pages, each carrying
 * the NAMAAH letterhead header (top), a compact per-page candidate signature strip,
 * and the letterhead footer (bottom) — mirroring the Word doc layout.
 * Whole-block pagination: a block never splits across pages.
 */
export function PaginatedDoc({
  blocks,
  signature,
  candidateName,
}: {
  blocks: React.ReactNode[];
  signature?: SigData | null;
  candidateName?: string;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([[...blocks.keys()]]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    if (!children.length) { setPages([[]]); return; }

    const result: number[][] = [];
    let current: number[] = [];
    let pageTop = children[0].offsetTop;

    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const forceBreak = c.classList.contains("od-break-before");
      const bottom = c.offsetTop + c.offsetHeight;
      if (current.length && (forceBreak || bottom - pageTop > USABLE_PX)) {
        result.push(current);
        current = [];
        pageTop = c.offsetTop;
      }
      current.push(i);
    }
    if (current.length) result.push(current);
    setPages(result.length ? result : [[]]);
  }, [blocks]);

  return (
    <div className="od-paged-root">
      {/* Hidden measurer — same width/font as page body so measured heights match. */}
      <div ref={measureRef} className="od-measure" aria-hidden>
        {blocks}
      </div>

      {pages.map((idxs, p) => (
        <div className="od-page" key={p}>
          <LetterheadHeader />
          <div className="od-page-body">{idxs.map((i) => blocks[i])}</div>
          <PageSigStrip sig={signature} name={candidateName} page={p + 1} total={pages.length} />
          <LetterheadFooter />
        </div>
      ))}
    </div>
  );
}
