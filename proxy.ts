import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = [
  "/_next",
  "/api/",
  "/templates",
  "/images",
  "/fonts",
];
const PUBLIC_PATHS = new Set([
  "/login",
  "/favicon.ico",
  "/api/auth/login",
  "/api/auth/logout",
]);

const STATIC_EXT =
  /\.(png|jpg|jpeg|gif|svg|webp|ico|txt|json|xml|css|js|map)$/i;

function isPublicPath(pathname: string) {
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

function isHtmlRequest(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) return true;
  const pathname = req.nextUrl.pathname;
  const hasExt = /\.[a-zA-Z0-9]+$/.test(pathname);
  return !hasExt && !pathname.startsWith("/api/");
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  console.log("[v0] Proxy - pathname:", pathname, "token:", token ? "exists" : "missing");

  if (pathname.startsWith("/login")) {
    console.log("[v0] Proxy - on login page, token:", token ? "exists" : "missing");
    if (token) {
      const dest = req.nextUrl.searchParams.get("redirect");
      const target = dest && dest.startsWith("/") ? dest : "/";
      console.log("[v0] Proxy - redirecting from login to:", target);
      return NextResponse.redirect(new URL(target, req.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isHtmlRequest(req)) {
    return NextResponse.next();
  }

  if (!token) {
    console.log("[v0] Proxy - no token, redirecting to login");
    const loginUrl = new URL("/login", req.url);
    const target = `${pathname}${req.nextUrl.search || ""}`;
    loginUrl.searchParams.set("redirect", target || "/");
    return NextResponse.redirect(loginUrl);
  }

  console.log("[v0] Proxy - authenticated, allowing access to:", pathname);
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/:path*"],
};
