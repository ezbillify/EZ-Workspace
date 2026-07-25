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

﻿"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useMeetings, Meeting } from "@/hooks/useMeetings";
import { useAuth } from "@/components/layout/AuthProvider";
import { useNotifications } from "@/components/layout/NotificationProvider";
import { cn } from "@/lib/utils";
import {
  Video,
  Mic,
  Calendar,
  Clock,
  Users,
  Globe,
  Loader2,
  Play,
} from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

const STATUS_STYLES: Record<Meeting["status"], string> = {
  scheduled: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  active:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  ended:     "bg-theme-raised text-theme-muted border border-theme-border",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
};

function StatusBadge({ status }: { status: Meeting["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {status === "active" && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function EmployeeMeetingsPage() {
  const { user } = useAuth();
  const { meetings, loading } = useMeetings();
  const { setActiveCall } = useNotifications();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const filtered = meetings.filter((m) => {
    const isParticipant =
      m.meeting_participants?.some((p) => p.employee_id === user?.id) ||
      m.host_id === user?.id;
    const matchTab =
      tab === "past"
        ? m.status === "ended" || m.status === "cancelled"
        : m.status === "scheduled" || m.status === "active";
    return isParticipant && matchTab;
  });

  return (
    <DashboardShell
      moduleKey="my_meetings"
      title="Meetings"
      subtitle="Your scheduled and active meetings."
    >
      <div className="space-y-5">

        {/* Tab Selector */}
        <div className="flex w-fit rounded-xl border border-theme-border bg-theme-raised p-1 gap-0.5">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                tab === t
                  ? "bg-theme-surface text-theme-fg shadow-sm"
                  : "text-theme-muted hover:text-theme-fg"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={20} className="animate-spin text-theme-muted" />
              <p className="text-xs font-semibold text-theme-muted">Loading meetings…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-theme-card border border-theme-border rounded-xl p-5 py-16 text-center text-theme-subtle">
            <Calendar size={32} className="mx-auto mb-3 opacity-20" strokeWidth={1.5} />
            <p className="text-sm font-medium">No {tab} meetings</p>
            <p className="mt-1 text-xs">
              Your manager will schedule meetings and they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => {
              const when = m.scheduled_at
                ? isToday(new Date(m.scheduled_at))
                  ? `Today ${format(new Date(m.scheduled_at), "h:mm a")}`
                  : isTomorrow(new Date(m.scheduled_at))
                  ? `Tomorrow ${format(new Date(m.scheduled_at), "h:mm a")}`
                  : format(new Date(m.scheduled_at), "MMM d, h:mm a")
                : "Instant";
              const Icon = m.type === "audio" ? Mic : Video;

              return (
                <div
                  key={m.id}
                  className="bg-theme-card border border-theme-border rounded-xl p-5 flex items-center gap-4"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                      m.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "border border-theme-border bg-theme-page text-theme-primary"
                    )}
                  >
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-theme-fg">{m.title}</h3>
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-theme-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {when}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {m.meeting_participants?.length || 0} participants
                      </span>
                      {m.host && (
                        <span className="flex items-center gap-1">
                          <Globe size={11} />
                          {m.host.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {m.status !== "ended" && m.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        setActiveCall({
                          roomName: m.room_name,
                          title: m.title,
                          type: m.type,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-theme-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                    >
                      <Play size={11} /> Join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
