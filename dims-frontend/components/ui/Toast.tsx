"use client";

import * as RadixToast from "@radix-ui/react-toast";
import React, { createContext, useContext, useState } from "react";

type ToastVariant = "default" | "success" | "error" | "warning";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextType = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

// Tailwind classes for each variant
const variantStyles: Record<ToastVariant, string> = {
  default: "bg-blue-600",
  success: "bg-green-600",
  error: "bg-[#e9212e]",
  warning: "bg-amber-500",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: Omit<ToastItem, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            className={`text-white p-4 rounded-xl shadow-lg mb-2 relative ${variantStyles[t.variant]}`}
          >
            <RadixToast.Title className="font-semibold">{t.title}</RadixToast.Title>
            {t.description && (
              <RadixToast.Description className="text-sm opacity-90">
                {t.description}
              </RadixToast.Description>
            )}
            <RadixToast.Close className="absolute top-2 right-2 text-white cursor-pointer">
              ✕
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport className="fixed bottom-4 right-4 flex flex-col w-80 z-50 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
