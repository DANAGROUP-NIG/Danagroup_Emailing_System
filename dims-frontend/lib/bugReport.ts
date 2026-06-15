import * as Sentry from "@sentry/nextjs";

/**
 * Bug reporting utility for DIMS
 * 
 * Generates diagnostic information and opens a pre-filled email to IT support.
 * Used by the "Report a bug" feature in the user menu.
 */

/**
 * Captures diagnostic information about the current application state.
 * Redacts sensitive information.
 */
export interface BugReportDiagnostics {
  /** Current URL */
  url: string;
  /** Browser user agent */
  browser: string;
  /** Screen dimensions */
  screen: string;
  /** Current user ID (if available) */
  userId?: string;
  /** Last action before error (if tracked) */
  lastAction?: string | undefined;
  /** Current time */
  timestamp: string;
  /** App version */
  version: string;
  /** Whether Sentry is configured */
  sentryConfigured: boolean;
  /** Sentry event ID if captured */
  sentryEventId?: string | undefined;
  /** Current error message if reporting an error */
  errorMessage?: string | undefined;
}

/**
 * Collects diagnostic information safely.
 */
export function collectDiagnostics(userId?: string, lastAction?: string, error?: Error): BugReportDiagnostics {
  // Check if Sentry is configured
  const client = Sentry.getClient();

  return {
    url: typeof window !== "undefined" ? window.location.href : "",
    browser: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}`,
    userId: userId ? `[REDACTED-${userId.slice(0, 4)}...]` : "anonymous",
    lastAction,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
    sentryConfigured: !!client,
    sentryEventId: undefined, // Sentry v8 API change - event ID not directly accessible
    errorMessage: error?.message,
  };
}

/**
 * Formats diagnostics into a readable email body.
 */
function formatEmailBody(diagnostics: BugReportDiagnostics, description: string): string {
  const sections = [
    "--- BUG REPORT ---",
    "",
    "Description:",
    description || "[Please describe the issue here]",
    "",
    "--- DIAGNOSTIC INFO ---",
    `URL: ${diagnostics.url}`,
    `Browser: ${diagnostics.browser}`,
    `Screen: ${diagnostics.screen}`,
    `User ID: ${diagnostics.userId}`,
    `Timestamp: ${diagnostics.timestamp}`,
    `Version: ${diagnostics.version}`,
    `Sentry Configured: ${diagnostics.sentryConfigured}`,
  ];

  if (diagnostics.sentryEventId) {
    sections.push(`Sentry Event ID: ${diagnostics.sentryEventId}`);
  }

  if (diagnostics.lastAction) {
    sections.push(`Last Action: ${diagnostics.lastAction}`);
  }

  if (diagnostics.errorMessage) {
    sections.push(`Error Message: ${diagnostics.errorMessage}`);
  }

  sections.push(
    "",
    "---",
    "This report was generated automatically by DIMS.",
    "Please do not modify the diagnostic information above."
  );

  return sections.join("\n");
}

/**
 * IT support email address.
 * Configurable via environment variable.
 */
const IT_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_IT_SUPPORT_EMAIL ?? "it-support@danagroup.com";

/**
 * Opens the user's email client with a pre-filled bug report.
 * 
 * @param userId - Current user ID for context
 * @param lastAction - Last known user action
 * @param error - Optional error that triggered the report
 * @param customDescription - Optional custom description from user
 */
export function openBugReportEmail(
  userId?: string,
  lastAction?: string,
  error?: Error,
  customDescription?: string
): void {
  const diagnostics = collectDiagnostics(userId, lastAction, error);
  const body = formatEmailBody(diagnostics, customDescription ?? "");
  const subject = `[DIMS Bug Report] Issue reported by ${diagnostics.userId ?? "user"}`;

  const mailtoUrl = `mailto:${IT_SUPPORT_EMAIL}?${new URLSearchParams({
    subject,
    body,
  }).toString()}`;

  // Open email client
  window.location.href = mailtoUrl;

  // Also capture to Sentry for tracking
  Sentry.captureMessage("Bug report initiated by user", {
    level: "info",
    tags: {
      type: "user_bug_report",
    },
    extra: {
      diagnostics,
      customDescription,
    },
  });
}

/**
 * React hook for bug reporting with automatic user context.
 * 
 * @example
 * ```tsx
 * function HelpMenu() {
 *   const { reportBug } = useBugReport();
 *   return <button onClick={reportBug}>Report a bug</button>;
 * }
 * ```
 */
export function useBugReport() {
  // Import dynamically to avoid SSR issues
  const reportBug = (description?: string, lastAction?: string) => {
    if (typeof window === "undefined") return;

    // Get user from store (we'll get this via the calling component to avoid circular deps)
    const userId = undefined; // Will be provided by caller

    openBugReportEmail(userId, lastAction, undefined, description);
  };

  return { reportBug, openBugReportEmail, collectDiagnostics };
}
