// components/ui/Input.tsx — Canonical Input
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: 'input' | 'textarea';
  rows?: number;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth,
      id: idProp,
      as: asProp = 'input',
      rows,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const helpId = `${id}-help`;

    const sharedClassName = cn(
      "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-dana-sm",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors",
      error && "border-danger focus-visible:ring-danger/30",
      leftIcon && "pl-9",
      rightIcon && "pr-9",
      fullWidth && "w-full",
      asProp === 'input' && "h-10",
      className,
    );

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

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {leftIcon}
            </span>
          )}

          {asProp === 'textarea' ? (
            <textarea
              id={id}
              aria-describedby={error || helperText ? helpId : undefined}
              aria-invalid={error ? true : undefined}
              rows={rows ?? 3}
              className={sharedClassName}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref}
              id={id}
              aria-describedby={error || helperText ? helpId : undefined}
              aria-invalid={error ? true : undefined}
              className={sharedClassName}
              {...props}
            />
          )}

          {rightIcon && (
            <span className="pointer-events-none absolute right-3 flex items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {rightIcon}
            </span>
          )}
        </div>

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

Input.displayName = "Input";

export { Input };
export default Input;

// ─── ComposeInput ─────────────────────────────────────────────────────────────
// Thin wrapper kept for backward compat with ComposeModal which uses register spread.
// Callers: just use <Input {...register('field')} label="..." error={errors.field?.message} />

export interface ComposeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errors?: { message?: string };
}

export const ComposeInput = React.forwardRef<
  HTMLInputElement,
  ComposeInputProps
>(({ label, errors, ...props }, ref) => (
  <Input
    ref={ref}
    label={label}
    error={errors?.message}
    fullWidth
    {...props}
  />
));

ComposeInput.displayName = "ComposeInput";
