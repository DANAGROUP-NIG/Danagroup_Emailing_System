// components/ui/Toast.tsx
//
// Usage:
//   1. Mount <ToastProvider> once at the app root (already done in components/provider.tsx).
//   2. In any client component: const { showToast } = useToast()
//      showToast({ title: "Saved", variant: "success" })
//
"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const variantClasses: Record<ToastVariant, string> = {
  default: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  error: "bg-danger text-danger-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-dana-blue-100 text-dana-blue-900",
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: Omit<ToastItem, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            className={cn(
              "relative flex flex-col gap-0.5 rounded-xl p-4 pr-10 shadow-dana-md",
              "animate-in slide-in-from-bottom-4 fade-in-0",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-4",
              variantClasses[t.variant],
            )}
          >
            <RadixToast.Title className="text-sm font-semibold leading-snug">
              {t.title}
            </RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-xs opacity-90 leading-relaxed">
                {t.description}
              </RadixToast.Description>
            )}
            <RadixToast.Close
              aria-label="Close notification"
              className="absolute right-2 top-2 rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== t.id))
              }
            >
              <X className="h-4 w-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[200] flex w-80 flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
