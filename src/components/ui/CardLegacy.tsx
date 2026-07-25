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

interface CardProps {
 children: React.ReactNode;
 className?: string;
 title?: string;
 subtitle?: string;
}

export function Card({ children, className, title, subtitle }: CardProps) {
 return (
 <div className={cn("enterprise-card", className)}>
 {(title || subtitle) && (
 <div className="border-b border-theme-border px-6 py-4 bg-theme-raised/50">
 {title && <h3 className="text-[10px] font-black text-theme-fg uppercase tracking-[0.2em] leading-none mb-1">{title}</h3>}
 {subtitle && <p className="text-[9px] font-medium text-theme-muted uppercase tracking-widest">{subtitle}</p>}
 </div>
 )}
 <div className="p-6">{children}</div>
 </div>
 );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
 return (
 <div className={cn("border-b border-theme-border px-6 py-4 bg-theme-raised/50", className)}>
 {children}
 </div>
 );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
 return (
 <h3 className={cn("text-[10px] font-black text-theme-fg uppercase tracking-[0.2em]", className)}>
 {children}
 </h3>
 );
}
