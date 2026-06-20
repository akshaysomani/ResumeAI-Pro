"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, title }]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => toast(msg, "success", title), [toast]);
  const error = useCallback((msg: string, title?: string) => toast(msg, "error", title), [toast]);
  const warning = useCallback((msg: string, title?: string) => toast(msg, "warning", title), [toast]);
  const info = useCallback((msg: string, title?: string) => toast(msg, "info", title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      
      {/* Toast Portal Area */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = {
              success: CheckCircle,
              error: AlertCircle,
              warning: AlertTriangle,
              info: Info,
            }[t.type];

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={cn(
                  "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all",
                  {
                    "border-green-100 bg-green-50/95 text-green-900 dark:border-green-900/30 dark:bg-green-950/90 dark:text-green-200":
                      t.type === "success",
                    "border-red-100 bg-red-50/95 text-red-900 dark:border-red-900/30 dark:bg-red-950/90 dark:text-red-200":
                      t.type === "error",
                    "border-amber-100 bg-amber-50/95 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/90 dark:text-amber-200":
                      t.type === "warning",
                    "border-zinc-200 bg-white/95 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-200":
                      t.type === "info",
                  }
                )}
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0 mt-0.5", {
                    "text-green-600 dark:text-green-400": t.type === "success",
                    "text-red-600 dark:text-red-400": t.type === "error",
                    "text-amber-600 dark:text-amber-400": t.type === "warning",
                    "text-zinc-600 dark:text-zinc-400": t.type === "info",
                  })}
                />
                <div className="flex-1 space-y-1">
                  {t.title && <p className="text-sm font-semibold leading-none">{t.title}</p>}
                  <p className="text-sm opacity-90">{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
