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

// Document block model shared by the auto-generated content modules and the templates.

export type DocBlockKind = "t" | "s" | "h" | "b" | "li";
export interface DocBlock {
  k: DocBlockKind; // t=section title, s=numbered section, h=sub-heading, b=body, li=list item
  t: string;
}

/**
 * Return the slice of blocks beginning at the first block whose text starts with
 * `start` (inclusive) up to the first block whose text starts with `end` (exclusive).
 * If `end` is omitted, returns to the end of the array.
 */
export function sliceBlocks(blocks: DocBlock[], start: string, end?: string): DocBlock[] {
  const startIdx = blocks.findIndex((b) => b.t.startsWith(start));
  if (startIdx === -1) return [];
  const rest = blocks.slice(startIdx);
  if (!end) return rest;
  const endIdx = rest.findIndex((b, i) => i > 0 && b.t.startsWith(end));
  return endIdx === -1 ? rest : rest.slice(0, endIdx);
}
