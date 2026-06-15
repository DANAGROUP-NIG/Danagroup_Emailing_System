import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Server Configuration
 * 
 * Captures errors from:
 * - Next.js Route Handlers
 * - Server Components
 * - API routes
 * - Middleware
 */

const SENTRY_DSN = process.env.SENTRY_DSN;
const isDev = process.env.NODE_ENV === "development";

const ERROR_SAMPLE_RATE = parseFloat(
  process.env.SENTRY_ERROR_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
);

Sentry.init({
  dsn: SENTRY_DSN,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION
    ? `${process.env.NEXT_PUBLIC_APP_NAME}@${process.env.NEXT_PUBLIC_APP_VERSION}`
    : undefined,

  // Environment
  environment: process.env.NODE_ENV,

  // Error sampling
  sampleRate: ERROR_SAMPLE_RATE,

  // Performance monitoring for server-side operations
  tracesSampleRate: parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
  ),

  // Server-side integrations
  integrations: [
    // Capture console logs as breadcrumbs
    Sentry.captureConsoleIntegration({
      levels: ["error", "warn"],
    }),
  ],

  // Before-send hook for PII scrubbing
  beforeSend(event) {
    // Scrub request headers
    if (event.request?.headers) {
      const headers = { ...event.request.headers };
      delete headers.cookie;
      delete headers.authorization;
      delete headers["x-auth-token"];
      event.request.headers = headers;
    }

    // Scrub user data
    if (event.user) {
      const user = { ...event.user };
      // Keep only non-PII identifiers
      delete user.email;
      delete user.ip_address;
      event.user = user;
    }

    return event;
  },

  // Debug mode in development
  debug: isDev,

  // Don't initialize if DSN is missing
  enabled: !!SENTRY_DSN,
});

export { Sentry };
