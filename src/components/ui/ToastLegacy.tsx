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

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: React.ReactNode;
  type: ToastType;
  onClick?: () => void;
}

interface ToastContextType {
  showToast: (message: React.ReactNode, type?: ToastType, onClick?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: React.ReactNode, type: ToastType = "info", onClick?: () => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, onClick }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <ToastPill toast={toast} onClose={() => removeToast(toast.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastPill({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-500" />,
    error: <AlertCircle size={16} className="text-rose-500" />,
    info: <Info size={16} className="text-sky-500" />,
    warning: <AlertTriangle size={16} className="text-amber-500" />,
  };

  const bgStyles = {
    success: "bg-emerald-50",
    error: "bg-rose-50",
    info: "bg-sky-50",
    warning: "bg-amber-50",
  };

  return (
    <div
      onClick={toast.onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-3 bg-white border border-zinc-100 shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-full max-w-[450px]",
        toast.onClick && "cursor-pointer hover:bg-zinc-50 active:scale-[0.98] transition-all"
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", bgStyles[toast.type])}>
        {icons[toast.type]}
      </div>
      
      <div className="text-sm font-semibold text-zinc-900 flex-1">
        {toast.message}
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
