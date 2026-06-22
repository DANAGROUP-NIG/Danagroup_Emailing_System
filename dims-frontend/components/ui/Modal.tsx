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
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={undefined}
          className={[
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-white p-6 shadow-dana-lg outline-none",
            "max-h-[85vh] overflow-y-auto",
            sizeClasses[size],
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title id="modal-title" className={title ? "text-lg font-semibold text-foreground" : "sr-only"}>
              {title ?? "Modal"}
            </Dialog.Title>

            <Dialog.Close
              aria-label="Close modal"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className={title ? "mt-4" : "mt-2"}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
