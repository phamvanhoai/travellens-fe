"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: number; title: string; description?: string; variant: ToastVariant };
type ToastInput = Omit<Toast, "id">;

const ToastContext = createContext<{ showToast: (toast: ToastInput) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = Date.now();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-24 z-[80] grid w-[calc(100vw-32px)] max-w-sm gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context.showToast;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? XCircle : Info;

  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <Icon className={cn("mt-0.5 size-5 shrink-0", toast.variant === "success" && "text-emerald-600", toast.variant === "error" && "text-rose-600", toast.variant === "info" && "text-brand-600")} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{toast.title}</p>
        {toast.description ? <p className="mt-1 text-sm text-slate-500">{toast.description}</p> : null}
      </div>
      <button type="button" onClick={onDismiss} className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Close notification">
        <X size={15} />
      </button>
    </div>
  );
}
