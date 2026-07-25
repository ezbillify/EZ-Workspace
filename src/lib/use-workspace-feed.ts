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

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LogRow, PresenceRow } from "@/lib/log-ui";

// Single realtime feed shared by every System observability page.
// `refresh()` is for manual button clicks (shows a spinner).
// Internal auto-fetch (poll + realtime debounce) never sets refreshing.
export function useWorkspaceFeed(limit = 500) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [presence, setPresence] = useState<PresenceRow[]>([]);
  const [serverNow, setServerNow] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tick = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/master-log?limit=${limit}`);
      if (res.ok) {
        const j = await res.json();
        setLogs(j.logs ?? []);
        setPresence(j.presence ?? []);
        setServerNow(j.serverTime ? new Date(j.serverTime).getTime() : Date.now());
      }
    } catch {
      /* keep last snapshot on transient failure */
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Manual refresh — shows spinner on the button
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const poll = setInterval(fetchData, 20_000);
    const ch = supabase
      .channel("workspace-feed-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_logs" }, () => {
        if (tick.current) clearTimeout(tick.current);
        tick.current = setTimeout(fetchData, 400);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        if (tick.current) clearTimeout(tick.current);
        tick.current = setTimeout(fetchData, 400);
      })
      .subscribe();
    return () => {
      clearInterval(poll);
      supabase.removeChannel(ch);
    };
  }, [fetchData]);

  return { logs, presence, serverNow, loading, refreshing, refresh };
}
