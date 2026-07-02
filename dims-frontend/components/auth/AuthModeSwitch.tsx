"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const modes = [
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
] as const;

export function AuthModeSwitch() {
  const pathname = usePathname();

  if (pathname !== "/login" && pathname !== "/signup") {
    return null;
  }

  return (
    <nav
      aria-label="Authentication mode"
      className="mb-4 grid h-10 grid-cols-2 rounded-lg border border-border bg-muted p-1"
    >
      {modes.map((mode) => {
        const isActive = pathname === mode.href;

        return (
          <Link
            key={mode.href}
            href={mode.href}
            replace
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-background text-foreground shadow-dana-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode.label}
          </Link>
        );
      })}
    </nav>
  );
}