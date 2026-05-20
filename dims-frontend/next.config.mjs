/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
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
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
