"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import * as Sentry from "@sentry/nextjs";
import logo from "@/assets/logo.png";
import { getLogger } from "@/lib/logger";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const logger = getLogger({ component: "error-boundary", scope: "root" });

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log structured error for server-side visibility
    logger.error(
      { error: error.message, digest: error.digest, stack: error.stack },
      "Root segment error captured"
    );

    // Send to Sentry for error tracking
    Sentry.captureException(error, {
      level: "error",
      tags: {
        error_boundary: "root",
        error_digest: error.digest,
      },
      extra: {
        digest: error.digest,
        location: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <div className="rounded-xl bg-dana-blue-900 px-6 py-3">
        <Image src={logo} width={140} height={36} alt="Dana Group" priority />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or return to the inbox.
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
          className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-dana-sm transition-colors hover:bg-primary-hover"
        >
          Try again
        </button>
        <Link
          href="/mail/inbox"
          className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Go to Inbox
        </Link>
      </div>
    </div>
  );
}
