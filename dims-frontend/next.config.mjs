import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */


const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.trycloudflare.com"],
  experimental: {
    serverComponentsExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  },
  async rewrites() {
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (configuredApiUrl?.startsWith("/")) {
      const apiUrl = configuredApiUrl.replace(/\/$/, "");
      const apiOrigin = process.env.INTERNAL_API_ORIGIN ?? "http://localhost:8000";

      return [
        {
          source: `${apiUrl}/:path*`,
          destination: `${apiOrigin}${apiUrl}/:path*`,
        },
      ];
    }

    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/minio/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/minio/**",
      },
      {
        protocol: "https",
        hostname: "pravatar.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dims.danagroup.internal",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    // NOTE: Content-Security-Policy is intentionally omitted here.
    // It is set per-request by middleware.ts with a cryptographic nonce so that
    // Next.js inline scripts (__NEXT_DATA__, chunk loaders) get the correct nonce.
    // A static nonce-less CSP here would conflict and block those scripts.
    const securityHeaders = [
      // X-Frame-Options: DENY - Prevents clickjacking (legacy header, CSP frame-ancestors is primary)
      { key: "X-Frame-Options", value: "DENY" },
      // X-Content-Type-Options: nosniff - Prevents MIME type sniffing
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Referrer-Policy: strict-origin-when-cross-origin - Limits referrer leakage
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Permissions-Policy: Disables unnecessary browser features
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), serial=(), xr-spatial-tracking=()",
      },
      // Cross-Origin-Opener-Policy: same-origin - Prevents cross-origin window manipulation
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      // Cross-Origin-Resource-Policy: same-origin - Prevents cross-origin resource loading
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ];

    // HSTS - Only in production (forces HTTPS)
    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Cache Next.js static chunks and fonts — safe to cache aggressively
      urlPattern: /^\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      // Cache Google Fonts stylesheets
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "google-fonts-stylesheets" },
    },
    {
      // Cache Google Fonts actual font files
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      // Cache static assets (images, icons, manifest)
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // NOTE: API routes (/api/**, /mail/**, /auth/**) are intentionally NOT cached —
    // caching mail content on shared devices is a security risk.
  ],
});

// Wrap with Sentry - configuration comes from sentry.*.config.ts files
const withSentry = (config) =>
  withSentryConfig(config, {
    // Upload source maps in production builds
    silent: process.env.NODE_ENV !== "production",
    // Only upload in CI/production to avoid dev noise
    dryRun: process.env.NODE_ENV === "development",
    // Auth tokens for source map upload (set in CI env)
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  });

export default withSentry(bundleAnalyzer(pwa(nextConfig)));
