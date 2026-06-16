import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;
const isDev = process.env.NODE_ENV === "development";

const ERROR_SAMPLE_RATE = parseFloat(
  process.env.SENTRY_ERROR_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
);

export async function register() {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: process.env.NEXT_PUBLIC_APP_VERSION
      ? `${process.env.NEXT_PUBLIC_APP_NAME}@${process.env.NEXT_PUBLIC_APP_VERSION}`
      : undefined,
    environment: process.env.NODE_ENV,
    sampleRate: ERROR_SAMPLE_RATE,
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
    ),
    integrations: [],
    debug: isDev && !!SENTRY_DSN,
    enabled: !!SENTRY_DSN,
  });
}
