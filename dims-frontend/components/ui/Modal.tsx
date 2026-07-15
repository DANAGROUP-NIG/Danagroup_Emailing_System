"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export default function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

        <Dialog.Content
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={undefined}
          className={[
            "fixed left-1/2 top-1/2 z-50",
            "w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "flex max-h-[85vh] flex-col",
            "overflow-hidden rounded-2xl border border-border",
            "bg-white shadow-dana-lg outline-none",
            sizeClasses[size],
          ].join(" ")}
        >
          {/* Fixed header */}
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6">
            <Dialog.Title
              id="modal-title"
              className={
                title
                  ? "text-lg font-semibold text-foreground"
                  : "sr-only"
              }
            >
              {title ?? "Modal"}
            </Dialog.Title>

            <Dialog.Close
              aria-label="Close modal"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div
            className={[
              "min-h-0 flex-1 overflow-y-auto px-6 mb-6 pb-6",
              "[scrollbar-gutter:stable]",
              title ? "mt-4" : "mt-2",
            ].join(" ")}
          >
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
