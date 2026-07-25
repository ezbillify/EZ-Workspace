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

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "secondary" | "indigo";

interface BadgeProps {
 variant?: BadgeVariant;
 children: React.ReactNode;
 className?: string;
 style?: React.CSSProperties;
}

const variants: Record<BadgeVariant, string> = {
 default: "bg-theme-raised text-theme-muted",
 success: "bg-theme-success-bg text-theme-success-fg",
 warning: "bg-theme-warning-bg text-theme-warning-fg",
 danger: "bg-theme-danger-bg text-theme-danger-fg",
 info: "bg-theme-info-bg text-theme-info-fg",
 purple: "bg-theme-purple-bg text-theme-purple-fg",
 secondary: "bg-theme-raised/50 text-theme-muted border border-theme-border",
 indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
};

export function Badge({ variant = "default", children, className, style }: BadgeProps) {
 return (
 <span
 className={cn(
 "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
 variants[variant],
 className
 )}
 style={style}
 >
 {children}
 </span>
 );
}

export function statusBadgeVariant(status: string): BadgeVariant {
 switch (status?.toLowerCase()) {
 case "approved": case "paid": case "present": case "claimable": case "active": case "processed": return "success";
 case "pending": case "locked": case "draft": case "expiring_soon": return "warning";
 case "rejected": case "absent": case "cancelled": case "overdue": case "inactive": return "danger";
 case "queued": case "held": case "purple": return "purple";
 case "pto": case "sent": case "info": return "info";
 default: return "default";
 }
}
