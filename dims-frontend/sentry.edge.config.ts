import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Edge Runtime Configuration
 * 
 * Captures errors from:
 * - Next.js middleware
 * - Edge API routes
 * - Edge runtime components
 * 
 * Note: Edge runtime has limited API surface - configure accordingly.
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

  // Performance monitoring (limited in edge)
  tracesSampleRate: parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
  ),

  // Edge-compatible integrations only
  integrations: [],

  // Debug mode in development
  debug: isDev,

  // Don't initialize if DSN is missing
  enabled: !!SENTRY_DSN,
});

export { Sentry };
