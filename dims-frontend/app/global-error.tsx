"use client";

// global-error.tsx must wrap its own <html><body> — it replaces the root layout
// on catastrophic render failures.
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Replace with Sentry.captureException(error) when Sentry is configured
    console.error("[DIMS] Unhandled root error:", error);
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
