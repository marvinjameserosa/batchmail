import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATH_PREFIXES = [
  "/_next",
  "/api/",
  "/templates",
  "/images",
  "/fonts",
];

const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/favicon.ico",
]);

const STATIC_EXT =
  /\.(png|jpg|jpeg|gif|svg|webp|ico|txt|json|xml|css|js|map)$/i;

/**
 * Check if a path is public (doesn't require auth)
 */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return false;
  if (STATIC_EXT.test(pathname)) return true;
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  for (const base of PUBLIC_PATHS) {
    if (pathname.startsWith(`${base}/`)) return true;
  }
  return false;
}

/**
 * Check if this is an HTML page request (not an API or asset)
 */
function isHtmlRequest(req: NextRequest): boolean {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) return true;
  const pathname = req.nextUrl.pathname;
  const hasExt = /\.[a-zA-Z0-9]+$/.test(pathname);
  return !hasExt && !pathname.startsWith("/api/");
}

/**
 * Proxy middleware - only handles route protection and redirects
 * All authentication logic (login, signup, etc.) is handled by server actions
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  // If user is on login/signup page and already authenticated, redirect to app
  if (pathname === "/login" || pathname === "/signup") {
    if (token) {
      const dest = req.nextUrl.searchParams.get("redirect");
      const target = dest && dest.startsWith("/") ? dest : "/";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  }

  // Allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow non-HTML requests through (API calls, assets, etc.)
  if (!isHtmlRequest(req)) {
    return NextResponse.next();
  }

  // Protected route - redirect to login if no token
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    const target = `${pathname}${req.nextUrl.search || ""}`;
    loginUrl.searchParams.set("redirect", target || "/");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/:path*"],
};
