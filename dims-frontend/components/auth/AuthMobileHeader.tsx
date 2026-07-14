"use client";

import { useBranding } from "@/hooks/useBranding";

export function AuthMobileHeader() {
  const branding = useBranding();
  return (
    <header className="flex lg:hidden items-center gap-2 px-6 py-4 border-b border-border">
      <img
        src={branding.logoUrl}
        alt={`${branding.name} logo`}
        className="h-6 w-auto object-contain"
      />
      <span className="text-sm font-semibold text-foreground">
        {branding.name} — DIMS
      </span>
    </header>
  );
}
