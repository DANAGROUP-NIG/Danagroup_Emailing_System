import pino, { LoggerOptions } from "pino";

/**
 * Structured logger for DIMS frontend
 * 
 * - Uses pino for high-performance structured logging
 * - Redacts sensitive fields (passwords, tokens, cookies, auth headers)
 * - Respects LOG_LEVEL environment variable
 * - Silent in production builds unless explicitly configured
 */

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL ?? (isProduction ? "warn" : "info");

// Build pino options conditionally for proper typing
const pinoOptions: LoggerOptions = {
  level: logLevel,
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.authToken",
      "cookie",
      "*.cookie",
      "authorization",
      "*.authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
    censor: "[REDACTED]",
  },
  base: {
    // Include service name for log aggregation
    service: "dims-frontend",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
  },
};

// Add transport only in development
if (!isProduction) {
  pinoOptions.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
    },
  };
}

/**
 * Global logger instance configured for DIMS observability requirements.
 * 
 * Features:
 * - Structured JSON output in production for log aggregation
 * - PII redaction for security compliance
 * - Environment-aware log levels (warn+ in production by default)
 * - Pretty printing in development for readability
 */
export const logger = pino(pinoOptions);

/**
 * Child logger factory for adding context to logs.
 * Use this to create domain-specific loggers with consistent context.
 * 
 * @example
 * const apiLogger = getLogger({ component: "api", operation: "fetchUser" });
 * apiLogger.info({ userId: "123" }, "Fetching user profile");
 */
export function getLogger(bindings: Record<string, unknown>): pino.Logger {
  return logger.child(bindings);
}

/**
 * No-op logger for production builds when logging must be completely disabled.
 * Use sparingly - prefer appropriate log levels instead.
 */
export const noopLogger: pino.Logger = {
  ...logger,
  info: () => {},
  debug: () => {},
  trace: () => {},
} as unknown as pino.Logger;
