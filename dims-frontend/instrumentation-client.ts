import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDev = process.env.NODE_ENV === "development";

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
  release: process.env.NEXT_PUBLIC_APP_VERSION
    ? `${process.env.NEXT_PUBLIC_APP_NAME}@${process.env.NEXT_PUBLIC_APP_VERSION}`
    : undefined,
  environment: process.env.NODE_ENV,
  sampleRate: ERROR_SAMPLE_RATE,
  tracesSampleRate: parseFloat(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? (isDev ? "1.0" : "0.1")
  ),
  replaysSessionSampleRate: REPLAY_SAMPLE_RATE,
  replaysOnErrorSampleRate: REPLAY_ON_ERROR_SAMPLE_RATE,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: true,
      unblock: [".sentry-unblock"],
    }),
  ],
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error instanceof Error) {
      if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("net::ERR")
      ) {
        return null;
      }
    }
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
  debug: isDev && !!SENTRY_DSN,
  enabled: !!SENTRY_DSN,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
