// TODO: Implement Next.js Auth Middleware
// - Runs on every request matching the config matcher
// - Checks for valid JWT in httpOnly cookie
// - If no valid token on a protected route → redirect to /login
// - If authenticated user visits /login → redirect to /mail/inbox
// - Public routes: /login only
// Ref: frontend-blueprint.md §7

import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const token = request.cookies.get("access_token")?.value;

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token ? "/mail/inbox" : "/login", request.url),
    );
  }

  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/mail/inbox", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
