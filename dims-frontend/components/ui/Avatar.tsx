// components/ui/Avatar.tsx — Canonical Avatar
"use client";

import * as React from "react";
import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0] ?? "";
  const last = lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "DG";
}

/** Deterministically pick one of 6 dana-blue/dana-red tint pairs from a name. */
function getFallbackColor(name: string): string {
  const palette: string[] = [
    "bg-dana-blue-600 text-white",
    "bg-dana-blue-400 text-white",
    "bg-dana-blue-800 text-white",
    "bg-dana-blue-200 text-dana-blue-900",
    "bg-dana-red-500 text-white",
    "bg-dana-red-200 text-dana-red-900",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const index = hash % palette.length;
  const result = palette[index];
  return result ?? "bg-dana-blue-600 text-white";
}

// ─── Size map ────────────────────────────────────────────────────────────────

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-24 w-24 text-2xl",
  "3xl": "h-32 w-32 text-3xl",
} as const;

const statusClasses = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  busy: "bg-warning",
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | undefined;
  avatarUrl?: string | undefined;
  name: string;
  initials?: string | undefined;
  size?: keyof typeof sizeClasses;
  status?: keyof typeof statusClasses;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Avatar({
  src,
  avatarUrl,
  name,
  initials: initialsProp,
  size = "md",
  status,
  className,
  ...htmlProps
}: AvatarProps) {
  const initials = initialsProp ?? getInitials(...(name.split(" ") as [string?, string?]));
  const resolvedSrc = src ?? avatarUrl;
  const fallbackColor = getFallbackColor(name);

  return (
    <span {...htmlProps} className={cn("relative inline-flex shrink-0", className)}>
      <RadixAvatar.Root
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full select-none",
          sizeClasses[size],
        )}
      >
        <RadixAvatar.Image
          src={resolvedSrc}
          alt={name}
          className="h-full w-full object-cover"
        />
        <RadixAvatar.Fallback
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full font-semibold",
            fallbackColor,
          )}
          delayMs={0}
        >
          {initials}
        </RadixAvatar.Fallback>
      </RadixAvatar.Root>

      {status && (
        <span
          aria-label={status}
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
            statusClasses[status],
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          )}
        />
      )}
    </span>
  );
}

export default Avatar;
