'use client';

import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps {
  value?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  disabled?: boolean | undefined;
  children?: React.ReactNode | undefined;
}

export function Select({ value, onValueChange, disabled, children }: SelectProps) {
  return (
    <RadixSelect.Root
      {...(value !== undefined ? { value } : {}) as Record<string, never>}
      {...(onValueChange ? { onValueChange } : {}) as Record<string, never>}
      {...(disabled !== undefined ? { disabled } : {}) as Record<string, never>}
    >
      {children}
    </RadixSelect.Root>
  );
}

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>) {
  return (
    <RadixSelect.Trigger
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-dana-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className,
      )}
      {...props}
    >
      {children}
      <RadixSelect.Icon asChild>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}

export function SelectValue(props: React.ComponentPropsWithoutRef<typeof RadixSelect.Value>) {
  return <RadixSelect.Value {...props} />;
}

export function SelectContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.Content>) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        className={cn(
          'relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-background shadow-dana-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <RadixSelect.Viewport className="p-1">
          {children}
        </RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixSelect.Item>) {
  return (
    <RadixSelect.Item
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-foreground',
        'focus:bg-primary/10 focus:outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Check className="h-4 w-4 text-primary" />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
