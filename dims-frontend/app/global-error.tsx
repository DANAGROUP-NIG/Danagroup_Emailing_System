"use client";

// global-error.tsx must wrap its own <html><body> — it replaces the root layout
// on catastrophic render failures.
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to console in dev for immediate visibility
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[DIMS] Unhandled root error:", error);
    }

    // Send to Sentry immediately - this is a critical error
    Sentry.captureException(error, {
      level: "fatal",
      tags: {
        error_boundary: "global",
        error_digest: error.digest,
        severity: "critical",
      },
      extra: {
        digest: error.digest,
        location: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
      },
    });

    // Flush Sentry to ensure error is sent before potential page reload
    Sentry.flush(2000).catch(() => {
      // Silently ignore flush errors
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          background: "#0f172a",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "4rem", fontWeight: 800, lineHeight: 1 }}>500</p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#94a3b8", maxWidth: "28rem" }}>
          An unexpected error occurred. Our team has been notified. You can try
          reloading the page or returning to the inbox.
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Error ID: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              background: "#2e348f",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/mail/inbox"
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              background: "transparent",
              color: "#94a3b8",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "1px solid #334155",
              textDecoration: "none",
            }}
          >
            Go to Inbox
          </a>
        </div>
      </body>
    </html>
  );
}
