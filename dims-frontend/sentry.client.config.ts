import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Client Configuration
 * 
 * Captures errors from:
 * - React component crashes
 * - Unhandled promise rejections
 * - Console errors
 * - Performance monitoring (Web Vitals)
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDev = process.env.NODE_ENV === "development";

// Sample rates - configurable via env vars
const ERROR_SAMPLE_RATE = parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_ERROR_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
);
const REPLAY_SAMPLE_RATE = parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE ?? "0.05"
);
const REPLAY_ON_ERROR_SAMPLE_RATE = parseFloat(
  process.env.NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_RATE ?? "0.1"
);

Sentry.init({
  dsn: SENTRY_DSN,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION
    ? `${process.env.NEXT_PUBLIC_APP_NAME}@${process.env.NEXT_PUBLIC_APP_VERSION}`
    : undefined,

  // Environment
  environment: process.env.NODE_ENV,

  // Error sampling - capture 100% in dev, configurable in production
  sampleRate: ERROR_SAMPLE_RATE,

  // Performance monitoring (for transactions/spans)
  tracesSampleRate: parseFloat(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
  ),

  // Session replay - privacy-conscious configuration
  replaysSessionSampleRate: REPLAY_SAMPLE_RATE,
  replaysOnErrorSampleRate: REPLAY_ON_ERROR_SAMPLE_RATE,

  // Integrations
  integrations: [
    // Replay configuration
    Sentry.replayIntegration({
      // Mask all text content by default for privacy
      maskAllText: false,
      maskAllInputs: true,
      // Block media elements
      blockAllMedia: true,
      // Unblock specific safe elements if needed
      unblock: [".sentry-unblock"],
    }),
  ],

  // Before-send hook to filter out non-actionable errors or PII
  beforeSend(event, hint) {
    // Filter out specific non-actionable errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore network errors that are expected (offline, etc)
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("net::ERR")
      ) {
        return null;
      }
    }

    // Scrub sensitive data from extra context
    if (event.extra) {
      const scrubbedExtra = { ...event.extra };
      delete scrubbedExtra.password;
      delete scrubbedExtra.token;
      delete scrubbedExtra.cookie;
      delete scrubbedExtra.authorization;
      event.extra = scrubbedExtra;
    }

    return event;
  },

  // Debug mode in development
  debug: isDev,

  // Don't initialize if DSN is missing (optional setup)
  enabled: !!SENTRY_DSN,
});

// Export for manual usage
export { Sentry };
