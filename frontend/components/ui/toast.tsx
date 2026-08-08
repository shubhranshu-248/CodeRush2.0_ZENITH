"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE_TOASTS = 3;

const TOAST_STYLES: Record<
  ToastType,
  { icon: React.ElementType; iconClass: string; glow: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.18)] border-emerald-500/20",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-400",
    glow: "shadow-[0_0_24px_rgba(248,113,113,0.18)] border-red-500/20",
  },
  info: {
    icon: Info,
    iconClass: "text-indigo-400",
    glow: "shadow-[0_0_24px_rgba(99,102,241,0.18)] border-indigo-500/20",
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const { icon: Icon, iconClass, glow } = TOAST_STYLES[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`flex items-start gap-2.5 w-72 max-w-[calc(100vw-3rem)] rounded-xl border bg-[#0d0e12]/95 backdrop-blur-xl px-3.5 py-3 ${glow}`}
      onClick={() => onDismiss(toast.id)}
      role="status"
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
      <p className="text-xs text-gray-200 leading-snug break-words">{toast.message}</p>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => {
        const next = [...prev, toast];
        if (next.length > MAX_VISIBLE_TOASTS) {
          const overflow = next.slice(0, next.length - MAX_VISIBLE_TOASTS);
          overflow.forEach((t) => {
            const timer = timers.current.get(t.id);
            if (timer) {
              clearTimeout(timer);
              timers.current.delete(t.id);
            }
          });
          return next.slice(next.length - MAX_VISIBLE_TOASTS);
        }
        return next;
      });

      const timer = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
