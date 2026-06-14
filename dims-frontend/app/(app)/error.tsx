"use client";

import { useEffect } from "react";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Preserves the app shell (Sidebar + TopBar) around the error message
export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("[DIMS] App segment error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-light">
        <span className="text-2xl text-danger" aria-hidden="true">!</span>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An error occurred while loading this section.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-dana-sm transition-colors hover:bg-primary-hover"
        >
          Try again
        </button>
        <a
          href="/mail/inbox"
          className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Go to Inbox
        </a>
      </div>
    </div>
  );
}
