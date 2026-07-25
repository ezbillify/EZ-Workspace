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

import { type LogTimeFilter, type TimeOfDay, TIME_OF_DAY_OPTIONS, MONTH_NAMES } from "@/lib/log-ui";

// Two-part log filter used across the System log pages:
//   1) Time of day (Morning / Afternoon / Evening / Night — Indian clock)
//   2) Date — Year / Month / Day dropdowns (all IST)
// Renders bare <select>s so each page can drop them into its own toolbar row.
export function LogTimeFilters({
  value,
  onChange,
  years,
}: {
  value: LogTimeFilter;
  onChange: (v: LogTimeFilter) => void;
  years: number[];
}) {
  const set = (patch: Partial<LogTimeFilter>) => onChange({ ...value, ...patch });
  const cls = "h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground";
  const yearList = years.length ? years : [new Date().getFullYear()];

  return (
    <>
      <select className={cls} value={value.tod} onChange={(e) => set({ tod: e.target.value as TimeOfDay })} title="Time of day (IST)">
        {TIME_OF_DAY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select className={cls} value={value.year} onChange={(e) => set({ year: e.target.value })} title="Year">
        <option value="all">All years</option>
        {yearList.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </select>
      <select className={cls} value={value.month} onChange={(e) => set({ month: e.target.value })} title="Month">
        <option value="all">All months</option>
        {MONTH_NAMES.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
      </select>
      <select className={cls} value={value.day} onChange={(e) => set({ day: e.target.value })} title="Day">
        <option value="all">All days</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={String(d)}>{d}</option>)}
      </select>
    </>
  );
}
