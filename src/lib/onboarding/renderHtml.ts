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

import React from "react";

// ════════════════════════════════════════════════════════════════════════════
// Minimal React-element → HTML string serializer.
//
// Next.js App Router runs route handlers under the "react-server" condition,
// where `react-dom/server` (renderToStaticMarkup) is unavailable and importing
// it throws a build error. Our onboarding document templates are simple, pure,
// hook-free presentational components (div/p/h/span/ul/li/img + DocShell /
// Category / Letterhead*), so we can serialize them ourselves without
// react-dom/server. This keeps the Puppeteer PDF pipeline working server-side.
// ════════════════════════════════════════════════════════════════════════════

const VOID_TAGS = new Set(["img", "br", "hr", "input", "meta", "link"]);
const ATTR_MAP: Record<string, string> = { className: "class", htmlFor: "for" };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function styleToString(style: Record<string, unknown>): string {
  return Object.entries(style)
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => {
      const prop = k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      return `${prop}:${String(v)}`;
    })
    .join(";");
}

export function renderToHtml(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return escapeHtml(node);
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(renderToHtml).join("");
  if (!React.isValidElement(node)) return "";

  const el = node as React.ReactElement<any>;
  const type: any = el.type;
  const props: any = el.props || {};

  // Fragment → render children only
  if (type === React.Fragment) return renderToHtml(props.children);
  // Function component (pure, hook-free) → invoke and serialize its output
  if (typeof type === "function") return renderToHtml(type(props));
  // Anything non-host we can't serialize → fall back to children
  if (typeof type !== "string") return renderToHtml(props.children);

  // Host element
  let attrs = "";
  for (const [k, v] of Object.entries(props)) {
    if (k === "children" || k === "dangerouslySetInnerHTML" || k === "key" || k === "ref") continue;
    if (v == null || v === false) continue;
    if (k === "style" && typeof v === "object") {
      attrs += ` style="${escapeAttr(styleToString(v as Record<string, unknown>))}"`;
      continue;
    }
    const name = ATTR_MAP[k] || k;
    if (v === true) { attrs += ` ${name}`; continue; }
    attrs += ` ${name}="${escapeAttr(String(v))}"`;
  }

  const dsih = props.dangerouslySetInnerHTML?.__html;
  if (dsih != null) return `<${type}${attrs}>${dsih}</${type}>`;
  if (VOID_TAGS.has(type)) return `<${type}${attrs} />`;
  return `<${type}${attrs}>${renderToHtml(props.children)}</${type}>`;
}
