import { z } from "zod";

const envSchema = z.object({
  /** Backend API URL — absolute URL or relative path (e.g. "/api") */
  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .or(z.string().startsWith("/")),
  /** WebSocket URL — used by socket.io-client for real-time updates */
  NEXT_PUBLIC_WS_URL: z.string(),
  /** Application display name shown in the UI */
  NEXT_PUBLIC_APP_NAME: z.string(),
  /**
   * Server-side only — origin used by Next.js rewrites to proxy /api/* to the backend.
   * Only needed when NEXT_PUBLIC_API_URL is a relative path.
   */
  INTERNAL_API_ORIGIN: z.string().url().optional(),
});

/**
 * Validated environment variables.
 *
 * Import this instead of accessing `process.env` directly so that
 * missing / malformed values are caught at startup rather than at
 * runtime.
 *
 * NOTE: In Next.js, `NEXT_PUBLIC_*` vars are inlined at build time,
 * so the validation below runs against the build-time snapshot on the
 * client and against real env vars on the server.
 */
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  INTERNAL_API_ORIGIN: process.env.INTERNAL_API_ORIGIN,
});
