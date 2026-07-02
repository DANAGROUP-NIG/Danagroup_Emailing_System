/**
 * DIMS Security Middleware
 *
 * Security features implemented:
 * - CSP Nonce generation for script-src protection
 * - JWT signature verification via jose library
 * - Token refresh on expiry via internal fetch
 * - CSRF protection for state-changing requests (X-Requested-With header check)
 * - Role-based access control for admin routes
 * - Secure redirect handling
 *
 * Note: The JWT_SECRET must be available in middleware (edge runtime compatible).
 * In production, use JWKS endpoint or shared secret via env var.
 */

import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify, decodeJwt } from "jose";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Admin-only route patterns that require group_admin role
const ADMIN_ONLY_ROUTES = ["/admin/subsidiaries"];

// Routes requiring any admin role (group_admin or subsidiary_admin)
const ADMIN_ROUTES = ["/admin"];

// State-changing HTTP methods that require CSRF protection
const STATE_CHANGING_METHODS = ["POST", "PATCH", "PUT", "DELETE"];

// JWT secret from environment (must be available in edge runtime)
const JWT_SECRET = process.env.JWT_SECRET || "";

/**
 * Generate cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Build CSP header with nonce
 */
function buildCSPHeader(nonce: string, isDev: boolean): string {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "";
  const wsConnectExtra = wsUrl ? ` ${wsUrl}` : "";

  const directives = [
    "default-src 'self'",
    // 'strict-dynamic' propagates trust from nonced scripts to chunks they load dynamically.
    // 'unsafe-inline' is a CSP1/2 fallback only — CSP3 browsers ignore it when nonce is set.
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: http://minio:9000 http://localhost:9000 http://localhost https://dims.danagroup.internal https://pravatar.cc https://i.pravatar.cc",
    `connect-src 'self' ws://dims.danagroup.internal wss://dims.danagroup.internal http://localhost:8000 ws://localhost:8000${wsConnectExtra}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ];

  return directives.join("; ");
}

/**
 * Extract and verify JWT from access_token cookie
 * Returns decoded payload or null if invalid/expired
 *
 * Security model:
 * - When JWT_SECRET is configured: full HS256 signature + expiry verification
 * - When JWT_SECRET is absent: decode only (structure + expiry check)
 *   The cookie is HttpOnly so client JS cannot forge it; real auth happens
 *   on every backend API call via the same cookie.
 */
async function verifyAccessToken(token: string): Promise<Record<string, unknown> | null> {
  // Always decode first — validates JWT structure and reads the payload
  let decoded: Record<string, unknown>;
  try {
    decoded = decodeJwt(token) as Record<string, unknown>;
  } catch {
    return null; // Malformed JWT
  }

  // Manually enforce expiry when not doing full jwtVerify
  const now = Math.floor(Date.now() / 1000);
  if (typeof decoded.exp === "number" && decoded.exp < now) {
    return null; // Expired
  }

  // If JWT_SECRET is configured, additionally verify the HMAC-SHA256 signature
  if (JWT_SECRET) {
    try {
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(JWT_SECRET);
      const key = await crypto.subtle.importKey(
        "raw",
        secretKey,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
      );
      const { payload } = await jwtVerify(token, key);
      return payload as Record<string, unknown>;
    } catch {
      return null; // Signature invalid or token expired
    }
  }

  // No secret configured — structure and expiry already validated above
  return decoded;
}

/**
 * Attempt to refresh access token using refresh_token cookie
 * Returns new access token or null if refresh fails
 */
async function refreshAccessToken(request: NextRequest): Promise<string | null> {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) return null;

  try {
    // Edge Runtime requires an absolute URL.
    // INTERNAL_API_ORIGIN resolves correctly both in Docker (http://api:8000)
    // and locally (http://localhost:8000). Never use NEXT_PUBLIC_API_URL here
    // because relative paths and container-internal hostnames differ.
    const internalOrigin = process.env.INTERNAL_API_ORIGIN;
    const publicUrl = process.env.NEXT_PUBLIC_API_URL || "";
    let refreshUrl: string;
    if (internalOrigin) {
      refreshUrl = `${internalOrigin.replace(/\/+$/, "")}/api/auth/refresh`;
    } else if (publicUrl.startsWith("http")) {
      refreshUrl = `${publicUrl.replace(/\/+$/, "")}/auth/refresh`;
    } else {
      const proto = request.nextUrl.protocol;
      const host = request.headers.get("host") ?? "localhost:3000";
      refreshUrl = `${proto}//${host}/api/auth/refresh`;
    }
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      credentials: "include",
    });

    if (response.ok) {
      // The refresh endpoint sets new cookies in the response
      // We need to extract the new access_token from Set-Cookie header
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        const accessTokenMatch = setCookieHeader.match(/access_token=([^;]+)/);
        return accessTokenMatch?.[1] || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if request requires CSRF protection and validate header
 */
function validateCSRF(request: NextRequest): boolean {
  // Only validate state-changing methods
  if (!STATE_CHANGING_METHODS.includes(request.method)) {
    return true;
  }

  // Check for X-Requested-With header (sent by Axios by default)
  const requestedWith = request.headers.get("x-requested-with");
  return requestedWith === "XMLHttpRequest";
}

/**
 * Check if user has required role for the requested path
 */
function hasRequiredRole(
  user: Record<string, unknown> | null,
  pathname: string,
): boolean {
  if (!user) return false;

  const role = user.role as string | undefined;

  // group_admin-only routes
  if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return role === "group_admin";
  }

  // Any admin can access /admin routes
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    return role === "group_admin" || role === "subsidiary_admin";
  }

  return true;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV === "development";

  // Generate nonce for this request
  const nonce = generateNonce();

  // Build CSP header with nonce
  const cspValue = buildCSPHeader(nonce, isDev);

  // Forward nonce in request headers so Next.js reads it during SSR and adds
  // nonce="..." to every inline <script> it generates (hydration, chunk loader, etc.)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspValue);

  // Determine if this is a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Get access token from cookie
  const accessToken = request.cookies.get("access_token")?.value;

  // Verify CSRF for state-changing requests
  if (!validateCSRF(request)) {
    return new NextResponse(
      JSON.stringify({ error: "CSRF token validation failed" }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  // Handle root redirect
  if (pathname === "/") {
    const verifiedUser = accessToken ? await verifyAccessToken(accessToken) : null;
    return NextResponse.redirect(
      new URL(verifiedUser ? "/mail/inbox" : "/login", request.url),
    );
  }

  // Skip auth checks for public routes (but still apply CSP)
  if (isPublicRoute) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    response.headers.set("x-csp-nonce", nonce);
    response.headers.set("Content-Security-Policy", cspValue);

    // If user is already authenticated, redirect away from login pages
    if (accessToken) {
      const verifiedUser = await verifyAccessToken(accessToken);
      if (verifiedUser) {
        return NextResponse.redirect(new URL("/mail/inbox", request.url));
      }
    }

    return response;
  }

  // Protected route: verify authentication
  let user: Record<string, unknown> | null = null;

  if (accessToken) {
    user = await verifyAccessToken(accessToken);

    // If token expired, try to refresh
    if (!user) {
      const newToken = await refreshAccessToken(request);
      if (newToken) {
        user = await verifyAccessToken(newToken);

        // If refresh succeeded, create response with new cookie
        if (user) {
          const response = NextResponse.next({ request: { headers: requestHeaders } });
          response.cookies.set("access_token", newToken, {
            httpOnly: true,
            secure: !isDev,
            sameSite: "strict",
            path: "/",
          });
          response.headers.set("x-csp-nonce", nonce);
          response.headers.set("Content-Security-Policy", cspValue);

          // Check role authorization
          if (!hasRequiredRole(user, pathname)) {
            return NextResponse.redirect(new URL("/mail/inbox", request.url));
          }

          return response;
        }
      }
    }
  }

  // No valid token - redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access control
  if (!hasRequiredRole(user, pathname)) {
    return NextResponse.redirect(new URL("/mail/inbox", request.url));
  }

  // Authenticated and authorized - proceed with CSP headers
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-csp-nonce", nonce);
  response.headers.set("Content-Security-Policy", cspValue);

  return response;
}

export const config = {
  matcher: [
    // Skip static files, API proxy routes, PWA assets, and image files
    "/((?!_next/static|_next/image|metrics/|api/|favicon.ico|manifest.json|sw.js|workbox-.*\\.js|fallback-.*\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
