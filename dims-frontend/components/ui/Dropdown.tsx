// components/ui/Dropdown.tsx
"use client";

import * as React from "react";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Re-exports (primitive pass-throughs) ────────────────────────────────────

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;
export const DropdownMenuGroup = RadixDropdown.Group;
export const DropdownMenuPortal = RadixDropdown.Portal;
export const DropdownMenuSub = RadixDropdown.Sub;
export const DropdownMenuRadioGroup = RadixDropdown.RadioGroup;

// ─── Content ──────────────────────────────────────────────────────────────────

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RadixDropdown.Portal>
    <RadixDropdown.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-dana-md",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
        "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
        className,
      )}
      {...props}
    />
  </RadixDropdown.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

// ─── Item ─────────────────────────────────────────────────────────────────────

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Item>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <RadixDropdown.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

// ─── CheckboxItem ─────────────────────────────────────────────────────────────

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <RadixDropdown.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <RadixDropdown.ItemIndicator>
        <Check className="h-4 w-4" />
      </RadixDropdown.ItemIndicator>
    </span>
    {children}
  </RadixDropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

// ─── Label ────────────────────────────────────────────────────────────────────

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Label>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <RadixDropdown.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-semibold text-muted-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// ─── Separator ────────────────────────────────────────────────────────────────

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Separator>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// ─── Shortcut ─────────────────────────────────────────────────────────────────

export function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

// ─── SubTrigger ───────────────────────────────────────────────────────────────

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <RadixDropdown.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
      "focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </RadixDropdown.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

// ─── SubContent ───────────────────────────────────────────────────────────────

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof RadixDropdown.SubContent>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.SubContent>
>(({ className, ...props }, ref) => (
  <RadixDropdown.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-dana-md",
      "animate-in fade-in-0 zoom-in-95",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";
