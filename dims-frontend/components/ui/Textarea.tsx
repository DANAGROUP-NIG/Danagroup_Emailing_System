// components/ui/Textarea.tsx — Canonical Textarea
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  /** Grows with content up to a max height. */
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth,
      autoResize = false,
      id: idProp,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const helpId = `${id}-help`;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`;
      }
      onChange?.(e);
    };

    return (
      <div className={cn("flex flex-col gap-1", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium text-muted-foreground"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          aria-describedby={error || helperText ? helpId : undefined}
          aria-invalid={error ? true : undefined}
          onChange={handleChange}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-dana-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors resize-none",
            autoResize && "overflow-hidden",
            error && "border-danger focus-visible:ring-danger/30",
            fullWidth && "w-full",
            className,
          )}
          {...props}
        />

        {(error || helperText) && (
          <p
            id={helpId}
            className={cn(
              "text-xs",
              error ? "text-danger" : "text-muted-foreground",
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
export default Textarea;
