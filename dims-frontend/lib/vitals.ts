import type { NextWebVitalsMetric } from "next/app";

const VITALS_ENDPOINT = "/api/metrics/web-vitals";

/**
 * Send Web Vitals to Sentry as span measurements.
 * Falls back to console logging in development.
 */
async function sendToSentry(metric: NextWebVitalsMetric): Promise<void> {
  // Dynamic import to avoid bundling Sentry in non-Sentry builds
  try {
    const Sentry = await import("@sentry/nextjs");

    // Sentry v8 uses a different API - capture as measurement via metrics
    // or add to current scope as extra data
    Sentry.setTag("web_vital.name", metric.name);
    Sentry.setTag("web_vital.label", metric.label);

    // Capture as metric (Sentry v8 style) - using metric name with unit suffix
    const metricName = `web-vitals.${metric.name.toLowerCase().replace(/-/g, "_")}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    Sentry.metrics?.gauge(metricName, metric.value);

    // Also add to scope for context
    Sentry.setContext("web-vitals", {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      startTime: metric.startTime,
      label: metric.label,
    });
  } catch {
    // Sentry not available - silently continue
  }
}

export function reportWebVitals(metric: NextWebVitalsMetric): void {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug("[Web Vitals]", metric.name, metric.value.toFixed(2), metric);
  }

  // Send to Sentry (works in all environments if Sentry is configured)
  void sendToSentry(metric);

  // Skip local endpoint in production (Sentry handles it)
  if (isDev) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      startTime: metric.startTime,
      label: metric.label,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(VITALS_ENDPOINT, body);
    } else {
      fetch(VITALS_ENDPOINT, {
        body,
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => {
        // Silently ignore — metrics reporting must never break the app
      });
    }
  }
}
